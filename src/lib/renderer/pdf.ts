import * as zlib from 'zlib'
import * as fs from 'fs'
import * as Utils from './utils'
import type { QRCode, QRCodePdfRendererOptions } from '../types'
import type { RendererOptions, RendererOptionsInput, RGBAColor } from './utils'

interface Page { name: string, width: number, height: number }
interface Placement { qrData: QRCode, top: number, left: number, size: number }
type Callback<T> = (error: Error | null, result?: T) => void

// Minimal PDF 1.4 writer: QR codes drawn as vector rectangles, laid out on a
// grid that flows over as many pages as needed.
// Sizes and positions are given in millimetres; PDF user space is in points.
const PT_PER_MM = 72 / 25.4

// Page sizes in millimetres, portrait [width, height]
export const PAGE_SIZES: Record<string, [number, number]> = {
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  LETTER: [215.9, 279.4],
  LEGAL: [215.9, 355.6]
}

const DEFAULT_SIZE = 50 // mm, including the quiet zone
const DEFAULT_GAP = 5 // mm between codes
// When columns/rows are not given, keep this distance from the page edges
// (most printers cannot print up to the edge). top/left replace it on their side.
const AUTO_FIT_BORDER = 10 // mm
// Tolerance for floating point comparisons, in mm
const EPSILON = 1e-6

function isNonNegativeNumber (value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && value >= 0
}

function isPositiveInteger (value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && value >= 1 && Math.floor(value) === value
}

function round (n: number): number {
  return Math.round(n * 100) / 100
}

function getPageSize (name?: string): Page {
  const key = String(name || 'A4').toUpperCase()
  if (!Object.prototype.hasOwnProperty.call(PAGE_SIZES, key)) {
    throw new Error('Unsupported page size: ' + name + '. Supported: ' +
      Object.keys(PAGE_SIZES).join(', '))
  }

  return { name: key, width: PAGE_SIZES[key][0], height: PAGE_SIZES[key][1] }
}

/**
 * Lays out one axis of the grid
 *
 * @param  {Number} pageLength Page width or height
 * @param  {Number} size       Code size
 * @param  {Number} gap        Space between codes
 * @param  {Number} start      top/left (undefined: centered)
 * @param  {Number} count      columns/rows (undefined: as many as fit)
 * @return {Object}            { count, start, length }
 */
function layoutAxis (pageLength: number, size: number, gap: number, start?: number, count?: number) {
  if (typeof count === 'undefined') {
    const from = typeof start === 'undefined' ? AUTO_FIT_BORDER : start
    const available = pageLength - from - AUTO_FIT_BORDER
    count = Math.max(0, Math.floor((available + gap + EPSILON) / (size + gap)))
  }

  const length = count * size + (count - 1) * gap
  return {
    count,
    start: typeof start === 'undefined' ? (pageLength - length) / 2 : start,
    length
  }
}

/**
 * Resolves and validates the grid layout (all values in millimetres)
 *
 * @param  {Object} rendererOpts pageSize, size, gap, top, left, columns, rows
 * @return {Object}              page, size, gap, columns, rows, capacity, positionAt
 */
export function getGridLayout (rendererOpts?: QRCodePdfRendererOptions | null) {
  const opts = rendererOpts || {}
  const page = getPageSize(opts.pageSize)
  const size = typeof opts.size === 'undefined' ? DEFAULT_SIZE : opts.size
  const gap = typeof opts.gap === 'undefined' ? DEFAULT_GAP : opts.gap

  if (!isNonNegativeNumber(size) || size === 0) {
    throw new Error('PDF size must be a positive number of millimetres')
  }

  ;(['gap', 'top', 'left'] as const).forEach(function (key) {
    if (typeof opts[key] !== 'undefined' && !isNonNegativeNumber(opts[key])) {
      throw new Error('PDF ' + key + ' must be a non-negative number of millimetres')
    }
  })

  ;(['columns', 'rows'] as const).forEach(function (key) {
    if (typeof opts[key] !== 'undefined' && !isPositiveInteger(opts[key])) {
      throw new Error('PDF ' + key + ' must be a positive integer')
    }
  })

  const pageDesc = page.name + ' page (' + page.width + ' x ' + page.height + ' mm)'
  if (size > page.width || size > page.height) {
    throw new Error('QR code size (' + size + ' mm) is larger than the ' + pageDesc)
  }

  const x = layoutAxis(page.width, size, gap, opts.left, opts.columns)
  const y = layoutAxis(page.height, size, gap, opts.top, opts.rows)

  if (!x.count || !y.count) {
    throw new Error('No room for a ' + size + ' mm QR code on the ' + pageDesc +
      ' within ' + AUTO_FIT_BORDER + ' mm of the edges; set top/left or use a smaller size')
  }

  ;([[x, 'columns', 'wide', page.width], [y, 'rows', 'high', page.height]] as const).forEach(function (axis) {
    if (axis[0].count > 1 && axis[0].length > axis[3] + EPSILON) {
      throw new Error(axis[0].count + ' ' + axis[1] + ' of ' + size + ' mm codes with ' + gap + ' mm gaps need ' +
        round(axis[0].length) + ' mm, but the ' + page.name + ' page is ' + axis[3] + ' mm ' + axis[2])
    }
  })

  if (x.start + x.length > page.width + EPSILON || y.start + y.length > page.height + EPSILON) {
    throw new Error(x.count === 1 && y.count === 1
      ? 'QR code (' + size + ' mm at left ' + round(x.start) + ' mm, top ' + round(y.start) +
        ' mm) does not fit on the ' + pageDesc
      : 'Grid of ' + x.count + ' x ' + y.count + ' codes (' + round(x.length) + ' x ' + round(y.length) +
        ' mm) at left ' + round(x.start) + ' mm, top ' + round(y.start) + ' mm does not fit on the ' + pageDesc)
  }

  const capacity = x.count * y.count
  if (!Number.isSafeInteger(capacity)) {
    throw new Error('PDF grid contains too many positions')
  }

  // Calculate only the positions that will actually be drawn.
  function positionAt (index: number) {
    return {
      left: x.start + (index % x.count) * (size + gap),
      top: y.start + Math.floor(index / x.count) * (size + gap)
    }
  }

  return { page, size, gap, columns: x.count, rows: y.count, capacity, positionAt }
}

/**
 * Resolves and validates the layout of a single code
 *
 * @param  {Object} rendererOpts pageSize, size, top, left
 * @return {Object}              page, size, top, left
 */
export function getLayout (rendererOpts?: QRCodePdfRendererOptions | null) {
  const opts = Object.assign({}, rendererOpts, { columns: 1, rows: 1 })
  const grid = getGridLayout(opts)

  return { page: grid.page, size: grid.size, ...grid.positionAt(0) }
}

// PDF numbers: plain decimal notation, at most 4 decimals
function num (n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

function rgb (color: RGBAColor): string {
  return num(color.r / 255) + ' ' + num(color.g / 255) + ' ' + num(color.b / 255) + ' rg'
}

/**
 * Drawing operators for one code. A transformation matrix maps one unit to
 * one module with the origin at the code's top-left corner (y pointing down),
 * so every rectangle is expressed in whole modules. Dark modules are merged
 * into horizontal runs and filled as a single path, which avoids hairline
 * seams between adjacent rectangles in viewers.
 */
function drawCode (qrData: QRCode, opts: RendererOptions, placement: Placement, pageHeight: number, extGStates: Record<string, number>): string[] {
  const size = qrData.modules.size
  const data = qrData.modules.data
  const margin = opts.margin
  const total = size + margin * 2
  const scale = placement.size * PT_PER_MM / total
  const scaleOperand = num(scale)
  if (scaleOperand === '0') {
    throw new Error('PDF size is too small to draw the QR code at the requested margin')
  }
  const x = placement.left * PT_PER_MM
  const y = (pageHeight - placement.top) * PT_PER_MM

  const ops = ['q', [scaleOperand, 0, 0, '-' + scaleOperand, num(x), num(y), 'cm'].join(' ')]

  function paint (color: RGBAColor, name: string, drawOps: string[]): void {
    ops.push('q')
    if (color.a < 255) {
      extGStates[name] = color.a / 255
      ops.push('/' + name + ' gs')
    }
    ops.push(rgb(color))
    ops.push.apply(ops, drawOps)
    ops.push('f', 'Q')
  }

  if (opts.color.light.a) {
    paint(opts.color.light, 'GSLight', ['0 0 ' + total + ' ' + total + ' re'])
  }

  const rects = []
  for (let row = 0; row < size; row++) {
    let col = 0
    while (col < size) {
      if (!data[row * size + col]) {
        col++
        continue
      }

      const start = col
      while (col < size && data[row * size + col]) col++
      rects.push((start + margin) + ' ' + (row + margin) + ' ' + (col - start) + ' 1 re')
    }
  }
  paint(opts.color.dark, 'GSDark', rects)

  ops.push('Q')
  return ops
}

/**
 * Serializes the document
 *
 * @param  {Array}  pages      Per page, a list of { qrData, top, left, size }
 * @param  {Object} opts       Renderer options (Utils.getOptions)
 * @param  {Object} page       Page size { width, height } in mm
 * @return {Buffer}            PDF document
 */
function writeDocument (pages: Placement[][], opts: RendererOptions, page: Page): Buffer {
  const extGStates: Record<string, number> = {}
  const contents = pages.map(function (placements) {
    const ops: string[] = []
    placements.forEach(function (p) {
      ops.push.apply(ops, drawCode(p.qrData, opts, p, page.height, extGStates))
    })
    return zlib.deflateSync(Buffer.from(ops.join('\n') + '\n', 'latin1'))
  })

  const gsNames = Object.keys(extGStates)
  const resources = gsNames.length
    ? '/Resources << /ExtGState << ' + gsNames.map(function (name) {
      return '/' + name + ' << /Type /ExtGState /ca ' + num(extGStates[name]) + ' >>'
    }).join(' ') + ' >> >>'
    : '/Resources << >>'
  const mediaBox = '/MediaBox [0 0 ' + num(page.width * PT_PER_MM) + ' ' + num(page.height * PT_PER_MM) + ']'

  // 1: catalog, 2: page tree, then a page and its content stream per page, info last
  const pageIds = pages.map(function (_, i) { return 3 + i * 2 })
  const objects: Array<string | Buffer[]> = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [' + pageIds.map(function (id) { return id + ' 0 R' }).join(' ') +
      '] /Count ' + pages.length + ' >>'
  ]
  contents.forEach(function (content, i) {
    objects.push('<< /Type /Page /Parent 2 0 R ' + mediaBox + ' ' + resources +
      ' /Contents ' + (pageIds[i] + 1) + ' 0 R >>')
    objects.push([Buffer.from('<< /Length ' + content.length + ' /Filter /FlateDecode >>\nstream\n', 'latin1'),
      content, Buffer.from('\nendstream', 'latin1')])
  })
  objects.push('<< /Producer (node-qrcode) >>')
  const infoId = objects.length

  // Header; the comment with high-bit bytes marks the file as binary
  const chunks = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')]
  let offset = chunks[0].length
  const offsets: number[] = []

  objects.forEach(function (body, i) {
    const parts = [Buffer.from((i + 1) + ' 0 obj\n', 'latin1'),
      ...(Array.isArray(body) ? body : [Buffer.from(body, 'latin1')]),
      Buffer.from('\nendobj\n', 'latin1')]
    const obj = Buffer.concat(parts)

    offsets.push(offset)
    chunks.push(obj)
    offset += obj.length
  })

  // Cross-reference table: fixed 20-byte entries
  const xref = ['xref', '0 ' + (objects.length + 1), '0000000000 65535 f ']
    .concat(offsets.map(function (o) { return String(o).padStart(10, '0') + ' 00000 n ' }))
    .join('\n')

  chunks.push(Buffer.from(xref + '\ntrailer\n<< /Size ' + (objects.length + 1) +
    ' /Root 1 0 R /Info ' + infoId + ' 0 R >>\nstartxref\n' + offset + '\n%%EOF\n', 'latin1'))

  return Buffer.concat(chunks)
}

/**
 * Renders a QR code as a single-page PDF document
 *
 * @param  {Object} qrData  QR code data
 * @param  {Object} options Renderer options (rendererOpts: pageSize, size, top, left)
 * @return {Buffer}         PDF document
 */
export function render (qrData: QRCode, options?: RendererOptionsInput | null): Buffer {
  const opts = Utils.getOptions(options)
  const layout = getLayout(opts.rendererOpts)

  return writeDocument([[{ qrData, top: layout.top, left: layout.left, size: layout.size }]], opts, layout.page)
}

/**
 * Renders several QR codes on a grid, adding pages as needed
 *
 * @param  {Array}  qrDataList QR code data, one entry per code
 * @param  {Object} options    Renderer options
 *                             (rendererOpts: pageSize, size, gap, top, left, columns, rows)
 * @return {Buffer}            PDF document
 */
export function renderMany (qrDataList: QRCode[], options?: RendererOptionsInput | null): Buffer {
  const opts = Utils.getOptions(options)
  const grid = getGridLayout(opts.rendererOpts)
  const pages: Placement[][] = []

  qrDataList.forEach(function (qrData, i) {
    const index = i % grid.capacity
    if (index === 0) pages.push([])
    const cell = grid.positionAt(index)
    pages[pages.length - 1].push({ qrData, top: cell.top, left: cell.left, size: grid.size })
  })

  return writeDocument(pages, opts, grid.page)
}

export function renderToBuffer (qrData: QRCode, cb: Callback<Buffer>): void
export function renderToBuffer (qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback<Buffer>): void
export function renderToBuffer (qrData: QRCode, options: RendererOptionsInput | Callback<Buffer> | undefined, cb?: Callback<Buffer>): void {
  const done = (typeof options === 'function' ? options : cb) as Callback<Buffer>
  const opts = typeof options === 'function' ? undefined : options
  let buffer: Buffer
  try {
    buffer = render(qrData, opts)
  } catch (e) {
    done(e as Error)
    return
  }
  done(null, buffer)
}

export function renderToDataURL (qrData: QRCode, cb: Callback<string>): void
export function renderToDataURL (qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback<string>): void
export function renderToDataURL (qrData: QRCode, options: RendererOptionsInput | Callback<string> | undefined, cb?: Callback<string>): void {
  const done = (typeof options === 'function' ? options : cb) as Callback<string>
  renderToBuffer(qrData, typeof options === 'function' ? undefined : options, function (err, buffer) {
    if (err) return done(err)
    done(null, 'data:application/pdf;base64,' + buffer!.toString('base64'))
  })
}

export function renderToFile (path: string, qrData: QRCode, cb: Callback<never>): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback<never>): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | Callback<never> | undefined, cb?: Callback<never>): void {
  const done = (typeof options === 'function' ? options : cb) as Callback<never>
  renderToBuffer(qrData, typeof options === 'function' ? undefined : options, function (err, buffer) {
    if (err) return done(err)
    fs.writeFile(path, buffer!, done)
  })
}

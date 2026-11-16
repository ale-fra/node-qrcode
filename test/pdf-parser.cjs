// Minimal, strict parser for the single-page PDFs produced by lib/renderer/pdf.js.
// Used by the tests to validate the file structure and to rebuild the QR code
// geometry from the drawing operators.
const zlib = require('zlib')

const PT_PER_MM = 72 / 25.4

function fail (msg) {
  throw new Error('Invalid PDF: ' + msg)
}

/**
 * Validates the document structure and returns its parts
 *
 * @param  {Buffer} buffer PDF file
 * @return {Object}        { version, objects, trailer, content }
 */
exports.parse = function parse (buffer) {
  const text = buffer.toString('latin1')

  const header = /^%PDF-(\d\.\d)\n%[\x80-\xff]{4}\n/.exec(text)
  if (!header) fail('missing header/binary marker')

  const tail = /startxref\n(\d+)\n%%EOF\n$/.exec(text)
  if (!tail) fail('missing startxref/%%EOF')
  const xrefOffset = parseInt(tail[1], 10)
  if (text.slice(xrefOffset, xrefOffset + 5) !== 'xref\n') fail('startxref does not point to xref')

  const xref = /^xref\n0 (\d+)\n([\s\S]*?)trailer\n(<<[\s\S]*?>>)\n/.exec(text.slice(xrefOffset))
  if (!xref) fail('malformed xref/trailer')
  const count = parseInt(xref[1], 10)
  const entries = xref[2].split('\n').filter(Boolean)
  if (entries.length !== count) fail('xref has ' + entries.length + ' entries, expected ' + count)
  if (entries[0] !== '0000000000 65535 f ') fail('bad free entry')

  const objects = {}
  entries.slice(1).forEach(function (entry, i) {
    const id = i + 1
    if (!/^\d{10} 00000 n $/.test(entry)) fail('bad xref entry ' + JSON.stringify(entry))
    const offset = parseInt(entry.slice(0, 10), 10)
    const start = id + ' 0 obj\n'
    if (text.slice(offset, offset + start.length) !== start) fail('xref offset of object ' + id + ' is wrong')
    const end = text.indexOf('\nendobj\n', offset)
    objects[id] = { offset, body: text.slice(offset + start.length, end) }
  })

  const trailer = xref[3]
  if (!new RegExp('/Size ' + count + '\\b').test(trailer)) fail('trailer /Size mismatch')

  const root = /\/Root (\d+) 0 R/.exec(trailer)
  if (!root || !/\/Type \/Catalog/.test(objects[root[1]].body)) fail('no catalog')

  // Page tree: pages in /Kids order, /Count must match
  const pagesId = /\/Pages (\d+) 0 R/.exec(objects[root[1]].body)[1]
  const tree = objects[pagesId].body
  if (!/\/Type \/Pages\b/.test(tree)) fail('no page tree')
  const kids = /\/Kids \[([^\]]*)\]/.exec(tree)[1].match(/\d+ 0 R/g) || []
  if (!kids.length) fail('no pages')
  if (!new RegExp('/Count ' + kids.length + '\\b').test(tree)) fail('page tree /Count mismatch')

  const pages = kids.map(function (ref) {
    const id = parseInt(ref, 10)
    const page = objects[id].body
    if (!/\/Type \/Page\b/.test(page)) fail('object ' + id + ' is not a page')
    if (!new RegExp('/Parent ' + pagesId + ' 0 R').test(page)) fail('page ' + id + ' has the wrong parent')
    return readPage(buffer, objects, page)
  })

  return {
    version: header[1],
    objects,
    trailer,
    pages,
    // first page, for single-page documents
    content: pages[0].content,
    mediaBox: pages[0].mediaBox,
    extGStates: pages[0].extGStates
  }
}

function readPage (buffer, objects, page) {
  // Content stream: /Length must match the bytes between "stream\n" and "\nendstream"
  const contentsId = /\/Contents (\d+) 0 R/.exec(page)[1]
  const streamObj = objects[contentsId]
  const length = parseInt(/\/Length (\d+)/.exec(streamObj.body)[1], 10)
  const dataStart = streamObj.offset + (contentsId + ' 0 obj\n').length + streamObj.body.indexOf('stream\n') + 'stream\n'.length
  if (buffer.slice(dataStart + length, dataStart + length + 10).toString('latin1') !== '\nendstream') {
    fail('stream /Length does not match the stream data')
  }
  const raw = buffer.slice(dataStart, dataStart + length)
  const content = /\/FlateDecode/.test(streamObj.body) ? zlib.inflateSync(raw).toString('latin1') : raw.toString('latin1')

  const mediaBox = /\/MediaBox \[([^\]]+)\]/.exec(page)[1].split(' ').map(Number)
  const extGStates = {}
  const gsRe = /\/(\w+) << \/Type \/ExtGState \/ca ([\d.]+) >>/g
  let m
  while ((m = gsRe.exec(page))) extGStates[m[1]] = parseFloat(m[2])

  return { content, mediaBox, extGStates }
}

/**
 * Interprets the content stream: transformation matrix and filled groups
 *
 * @param  {String} content Decoded content stream
 * @return {Object}         { matrix: [a b c d e f], groups: [{ gs, rgb, rects }] }
 */
exports.parseContent = function parseContent (content) {
  const lines = content.trim().split('\n')
  let matrix = null
  const groups = []
  let group = null
  let depth = 0

  lines.forEach(function (line) {
    const parts = line.split(' ')
    const op = parts[parts.length - 1]
    const args = parts.slice(0, -1)

    if (op === 'q') {
      depth++
      if (depth === 2) group = { gs: null, rgb: null, rects: [], filled: false }
    } else if (op === 'Q') {
      if (depth === 2) groups.push(group)
      depth--
    } else if (op === 'cm') {
      matrix = args.map(Number)
    } else if (op === 'gs') {
      group.gs = args[0].slice(1)
    } else if (op === 'rg') {
      group.rgb = args.map(Number)
    } else if (op === 're') {
      group.rects.push(args.map(Number))
    } else if (op === 'f') {
      group.filled = true
    } else {
      throw new Error('Unexpected operator: ' + line)
    }
  })

  if (depth !== 0) throw new Error('Unbalanced q/Q')
  return { matrix, groups }
}

/**
 * Rebuilds the module matrix from the dark rectangles
 */
exports.modulesFromRects = function modulesFromRects (rects, size, margin) {
  const data = new Uint8Array(size * size)
  rects.forEach(function (r) {
    const x = r[0] - margin
    const y = r[1] - margin
    if (r[3] !== 1) throw new Error('rect height should be one module')
    for (let i = 0; i < r[2]; i++) {
      if (data[y * size + x + i]) throw new Error('overlapping rects')
      data[y * size + x + i] = 1
    }
  })
  return data
}

exports.PT_PER_MM = PT_PER_MM

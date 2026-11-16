import * as fs from 'fs'
import * as Utils from './utils'
import type { QRCode } from '../types'
import type { RendererOptionsInput } from './utils'

type Callback = (error: NodeJS.ErrnoException | null) => void

interface BlockChars {
  WW: string
  WB: string
  BB: string
  BW: string
}

const BLOCK_CHAR: BlockChars = {
  WW: ' ',
  WB: '▄',
  BB: '█',
  BW: '▀'
}

const INVERTED_BLOCK_CHAR: BlockChars = {
  BB: ' ',
  BW: '▄',
  WW: '█',
  WB: '▀'
}

function getBlockChar (top: number, bottom: number, blocks: BlockChars): string {
  if (top && bottom) return blocks.BB
  if (top && !bottom) return blocks.BW
  if (!top && bottom) return blocks.WB
  return blocks.WW
}

export function render (qrData: QRCode, options?: RendererOptionsInput, cb?: (error: null, output: string) => void): string {
  const opts = Utils.getOptions(options)
  let blocks = BLOCK_CHAR
  if (opts.color.dark.hex === '#ffffff' || opts.color.light.hex === '#000000') {
    blocks = INVERTED_BLOCK_CHAR
  }

  const size = qrData.modules.size
  const data = qrData.modules.data

  let output = ''
  let hMargin = Array(size + (opts.margin * 2) + 1).join(blocks.WW)
  hMargin = Array((opts.margin / 2) + 1).join(hMargin + '\n')

  const vMargin = Array(opts.margin + 1).join(blocks.WW)

  output += hMargin
  for (let i = 0; i < size; i += 2) {
    output += vMargin
    for (let j = 0; j < size; j++) {
      const topModule = data[i * size + j]
      const bottomModule = data[(i + 1) * size + j]

      output += getBlockChar(topModule, bottomModule, blocks)
    }

    output += vMargin + '\n'
  }

  output += hMargin.slice(0, -1)

  if (typeof cb === 'function') {
    cb(null, output)
  }

  return output
}

export function renderToFile (path: string, qrData: QRCode, cb: Callback): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | Callback | undefined, cb?: Callback): void {
  if (typeof cb === 'undefined') {
    cb = options as Callback
    options = undefined
  }

  const utf8 = render(qrData, options as RendererOptionsInput | undefined)
  fs.writeFile(path, utf8, cb)
}

import * as fs from 'fs'
import * as svgTagRenderer from './svg-tag'
import type { QRCode } from '../types'
import type { RendererOptionsInput } from './utils'

type Callback = (error: NodeJS.ErrnoException | null) => void

export const render = svgTagRenderer.render

export function renderToFile (path: string, qrData: QRCode, cb: Callback): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | Callback | undefined, cb?: Callback): void {
  if (typeof cb === 'undefined') {
    cb = options as Callback
    options = undefined
  }

  const svgTag = render(qrData, options as RendererOptionsInput | undefined)

  const xmlStr = '<?xml version="1.0" encoding="utf-8"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
    svgTag

  fs.writeFile(path, xmlStr, cb)
}

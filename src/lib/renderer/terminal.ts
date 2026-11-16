import * as big from './terminal/terminal'
import * as small from './terminal/terminal-small'
import type { QRCode } from '../types'
import type { RendererOptionsInput } from './utils'

export function render (qrData: QRCode, options?: RendererOptionsInput, cb?: (error: null, output: string) => void): string {
  if (options && options.small) {
    return small.render(qrData, options, cb)
  }
  return big.render(qrData, options, cb)
}

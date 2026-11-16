import canPromise = require('./can-promise')
import * as QRCode from './core/qrcode'
import * as CanvasRenderer from './renderer/canvas'
import * as SvgRenderer from './renderer/svg-tag'
import type { CanvasLike } from './renderer/canvas'
import type { RendererOptionsInput } from './renderer/utils'
import type {
  QRCode as QRCodeSymbol,
  QRCodeCallback,
  QRCodeInput,
  QRCodeRenderersOptions,
  QRCodeBrowserToDataURLOptions,
  QRCodeToStringOptions
} from './types'

type RenderFunc<T> = (data: QRCodeSymbol, canvas: CanvasLike | undefined, opts: RendererOptionsInput | undefined) => T

/**
 * Arguments can be passed as:
 * (canvas?, text, opts?, cb?)
 * The last function argument (if any) is the callback: if there is no callback,
 * a Promise is returned.
 *
 * Arguments are loosely typed on purpose: their meaning depends on their position
 * and on how many of them have been passed (see the public overloads below)
 *
 * @param renderFunc Render function
 * @param args       Arguments passed to the public API function
 */
function renderCanvas<T> (renderFunc: RenderFunc<T>, args: any[]): Promise<T> | undefined {
  // (no destructuring: it would pull iterator helpers into the ES5 browser bundle)
  let canvas = args[0]
  let text = args[1]
  let opts = args[2]
  let cb = args[3]
  const argsNum = args.length
  const isLastArgCb = typeof args[argsNum - 1] === 'function'

  if (!isLastArgCb && !canPromise()) {
    throw new Error('Callback required as last argument')
  }

  if (isLastArgCb) {
    if (argsNum < 2) {
      throw new Error('Too few arguments provided')
    }

    if (argsNum === 2) {
      cb = text
      text = canvas
      canvas = opts = undefined
    } else if (argsNum === 3) {
      if (canvas.getContext && typeof cb === 'undefined') {
        cb = opts
        opts = undefined
      } else {
        cb = opts
        opts = text
        text = canvas
        canvas = undefined
      }
    }
  } else {
    if (argsNum < 1) {
      throw new Error('Too few arguments provided')
    }

    if (argsNum === 1) {
      text = canvas
      canvas = opts = undefined
    } else if (argsNum === 2 && !canvas.getContext) {
      opts = text
      text = canvas
      canvas = undefined
    }

    return new Promise(function (resolve, reject) {
      try {
        const data = QRCode.create(text, opts)
        resolve(renderFunc(data, canvas, opts))
      } catch (e) {
        reject(e)
      }
    })
  }

  try {
    const data = QRCode.create(text, opts)
    cb(null, renderFunc(data, canvas, opts))
  } catch (e) {
    cb(e)
  }

  return undefined
}

export const create = QRCode.create

/**
 * Draws qr code symbol to canvas.
 * If canvas is not provided, a new canvas element is created.
 */
export function toCanvas (canvasElement: HTMLCanvasElement | CanvasLike, text: QRCodeInput, callback: QRCodeCallback<HTMLCanvasElement>): void
export function toCanvas (canvasElement: HTMLCanvasElement | CanvasLike, text: QRCodeInput, options?: QRCodeRenderersOptions): Promise<HTMLCanvasElement>
export function toCanvas (canvasElement: HTMLCanvasElement | CanvasLike, text: QRCodeInput, options: QRCodeRenderersOptions | undefined, callback: QRCodeCallback<HTMLCanvasElement>): void
export function toCanvas (text: QRCodeInput, callback: QRCodeCallback<HTMLCanvasElement>): void
export function toCanvas (text: QRCodeInput, options?: QRCodeRenderersOptions): Promise<HTMLCanvasElement>
export function toCanvas (text: QRCodeInput, options: QRCodeRenderersOptions | undefined, callback: QRCodeCallback<HTMLCanvasElement>): void
export function toCanvas (...args: any[]): Promise<CanvasLike> | undefined {
  return renderCanvas<CanvasLike>(CanvasRenderer.render, args)
}

/**
 * Returns a Data URI containing a representation of the QR Code image.
 * If canvas is not provided, a new canvas element is created.
 */
export function toDataURL (canvasElement: HTMLCanvasElement | CanvasLike, text: QRCodeInput, callback: QRCodeCallback<string>): void
export function toDataURL (canvasElement: HTMLCanvasElement | CanvasLike, text: QRCodeInput, options?: QRCodeBrowserToDataURLOptions): Promise<string>
export function toDataURL (canvasElement: HTMLCanvasElement | CanvasLike, text: QRCodeInput, options: QRCodeBrowserToDataURLOptions | undefined, callback: QRCodeCallback<string>): void
export function toDataURL (text: QRCodeInput, callback: QRCodeCallback<string>): void
export function toDataURL (text: QRCodeInput, options?: QRCodeBrowserToDataURLOptions): Promise<string>
export function toDataURL (text: QRCodeInput, options: QRCodeBrowserToDataURLOptions | undefined, callback: QRCodeCallback<string>): void
export function toDataURL (...args: any[]): Promise<string> | undefined {
  return renderCanvas<string>(CanvasRenderer.renderToDataURL, args)
}

function renderSvg (data: QRCodeSymbol, _: unknown, opts: RendererOptionsInput | undefined): string {
  return SvgRenderer.render(data, opts)
}

/**
 * Returns a string representation of the QR Code
 * (svg only for now: options.type is ignored).
 */
export function toString (text: QRCodeInput, callback: QRCodeCallback<string>): void
export function toString (text: QRCodeInput, options?: QRCodeToStringOptions): Promise<string>
export function toString (text: QRCodeInput, options: QRCodeToStringOptions | undefined, callback: QRCodeCallback<string>): void
export function toString (...args: any[]): Promise<string> | undefined {
  return renderCanvas<string>(renderSvg, args)
}

/**
 * Default export: allows `import QRCode from 'qrcode'` with bundlers
 *
 * Note: QRCode.create is referenced instead of `create`, since TypeScript
 * compiles references to exported variables to `exports.create`, which
 * prevents bundlers from detecting the named exports of this module
 */
export default { create: QRCode.create, toCanvas, toDataURL, toString }

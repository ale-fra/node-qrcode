import canPromise = require('./can-promise')
import * as QRCode from './core/qrcode'
import * as PngRenderer from './renderer/png'
import * as Utf8Renderer from './renderer/utf8'
import * as TerminalRenderer from './renderer/terminal'
import * as SvgRenderer from './renderer/svg'
import * as PdfRenderer from './renderer/pdf'
import { toCanvas as browserToCanvas } from './browser'
import type { Writable } from 'stream'
import type { RendererOptionsInput } from './renderer/utils'
import type {
  QRCode as QRCodeSymbol,
  QRCodeCallback,
  QRCodeErrorCallback,
  QRCodeInput,
  QRCodeToBufferOptions,
  QRCodeToDataURLOptions,
  QRCodeToFileOptions,
  QRCodeToFileStreamOptions,
  QRCodeToStringOptions,
  QRCodeToPdfOptions
} from './types'

type Callback = (error: any, result?: any) => void
type RenderFunc = (data: QRCodeSymbol, opts: RendererOptionsInput, cb: Callback) => unknown

interface Params {
  opts: RendererOptionsInput
  cb: Callback | null
}

/**
 * Renderer used by toFile(), toDataURL() and toBuffer()
 * (not all renderers support all the output methods)
 */
interface FileRenderer {
  renderToFile: (path: string, data: QRCodeSymbol, opts: RendererOptionsInput, cb: Callback) => void
  renderToDataURL?: RenderFunc
  renderToBuffer?: RenderFunc
}

/**
 * Arguments are loosely typed on purpose: their meaning depends on
 * which of them have been passed (see the public overloads below)
 */
function checkParams (text: unknown, opts: any, cb: any): Params {
  if (typeof text === 'undefined') {
    throw new Error('String required as first argument')
  }

  if (typeof cb === 'undefined') {
    cb = opts
    opts = {}
  }

  if (typeof cb !== 'function') {
    if (!canPromise()) {
      throw new Error('Callback required as last argument')
    } else {
      opts = cb || {}
      cb = null
    }
  }

  return {
    // null options are treated as omitted options
    opts: opts || {},
    cb
  }
}

/**
 * Returns a render function which reports an error through the callback.
 * Used when the requested output type is not supported by the called API
 * (eg. toDataURL() with type 'svg'), so that the error is delivered the same
 * way as any other rendering error (callback or rejected promise)
 */
function unsupportedType (apiName: string, type: string | undefined): RenderFunc {
  return function (_data, _opts, cb) {
    cb(new Error('Type "' + type + '" is not supported by ' + apiName +
      '(). Only "png" and "pdf" are supported.'))
  }
}

function getTypeFromFilename (path: string): string {
  return path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

function getRendererFromType (type: string | undefined): FileRenderer {
  switch (type) {
    case 'svg':
      return SvgRenderer

    case 'pdf':
    case 'application/pdf':
      return PdfRenderer

    case 'txt':
    case 'utf8':
      return Utf8Renderer

    case 'png':
    case 'image/png':
    default:
      return PngRenderer
  }
}

function getStringRendererFromType (type: string | undefined): { render: RenderFunc } {
  switch (type) {
    case 'svg':
      return SvgRenderer

    case 'terminal':
      return TerminalRenderer

    case 'utf8':
    default:
      return Utf8Renderer
  }
}

function render (renderFunc: RenderFunc, text: QRCodeInput, params: Params): Promise<any> | unknown {
  if (!params.cb) {
    return new Promise(function (resolve, reject) {
      try {
        const data = QRCode.create(text, params.opts)
        return renderFunc(data, params.opts, function (err, data) {
          return err ? reject(err) : resolve(data)
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  try {
    const data = QRCode.create(text, params.opts)
    return renderFunc(data, params.opts, params.cb)
  } catch (e) {
    params.cb(e)
  }
}

export const create = QRCode.create

export const toCanvas = browserToCanvas

/**
 * Returns a string representation of the QR Code.
 */
export function toString (text: QRCodeInput, callback: QRCodeCallback<string>): void
export function toString (text: QRCodeInput, options?: QRCodeToStringOptions): Promise<string>
export function toString (text: QRCodeInput, options: QRCodeToStringOptions | undefined, callback: QRCodeCallback<string>): void
export function toString (text: QRCodeInput, opts?: any, cb?: any): any {
  const params = checkParams(text, opts, cb)
  const renderer = getStringRendererFromType(params.opts.type)
  return render(renderer.render, text, params)
}

/**
 * Returns a Data URI containing a representation of the QR Code image.
 * Node.js: png or pdf (image/jpeg and image/webp: browser only).
 */
export function toDataURL (text: QRCodeInput, callback: QRCodeCallback<string>): void
export function toDataURL (text: QRCodeInput, options?: QRCodeToDataURLOptions): Promise<string>
export function toDataURL (text: QRCodeInput, options: QRCodeToDataURLOptions | undefined, callback: QRCodeCallback<string>): void
export function toDataURL (text: QRCodeInput, opts?: any, cb?: any): any {
  const params = checkParams(text, opts, cb)
  const renderer = getRendererFromType(params.opts.type)
  const renderFunc = renderer.renderToDataURL ||
    unsupportedType('toDataURL', params.opts.type)
  return render(renderFunc, text, params)
}

/**
 * Returns a Buffer containing a representation of the QR Code image.
 * Supports png and vector pdf formats.
 */
export function toBuffer (text: QRCodeInput, callback: QRCodeCallback<Buffer>): void
export function toBuffer (text: QRCodeInput, options?: QRCodeToBufferOptions): Promise<Buffer>
export function toBuffer (text: QRCodeInput, options: QRCodeToBufferOptions | undefined, callback: QRCodeCallback<Buffer>): void
export function toBuffer (text: QRCodeInput, opts?: any, cb?: any): any {
  const params = checkParams(text, opts, cb)
  const renderer = getRendererFromType(params.opts.type)
  const renderFunc = renderer.renderToBuffer ||
    unsupportedType('toBuffer', params.opts.type)
  return render(renderFunc, text, params)
}

/**
 * Saves QR Code to image file.
 * If `options.type` is not specified, the format will be guessed from file extension.
 */
export function toFile (path: string, text: QRCodeInput, callback: QRCodeErrorCallback): void
export function toFile (path: string, text: QRCodeInput, options?: QRCodeToFileOptions): Promise<void>
export function toFile (path: string, text: QRCodeInput, options: QRCodeToFileOptions | undefined, callback: QRCodeErrorCallback): void
export function toFile (path: string, text: QRCodeInput, opts?: any, cb?: any): any {
  if (typeof path !== 'string' || !(typeof text === 'string' || typeof text === 'object')) {
    throw new Error('Invalid argument')
  }

  if ((arguments.length < 3) && !canPromise()) {
    throw new Error('Too few arguments provided')
  }

  const params = checkParams(text, opts, cb)
  const type = params.opts.type || getTypeFromFilename(path)
  const renderer = getRendererFromType(type)
  const renderToFile = renderer.renderToFile.bind(null, path)

  return render(renderToFile, text, params)
}

/**
 * Writes QR Code image to stream. Only works with png format for now.
 * Errors are emitted on the stream ('error' event).
 */
export function toFileStream (stream: Writable, text: QRCodeInput, options?: QRCodeToFileStreamOptions): void
/**
 * @deprecated The callback is never called: errors are emitted on the stream ('error' event).
 */
export function toFileStream (stream: Writable, text: QRCodeInput, callback: QRCodeErrorCallback): void
/**
 * @deprecated The callback is never called: errors are emitted on the stream ('error' event).
 */
export function toFileStream (stream: Writable, text: QRCodeInput, options: QRCodeToFileStreamOptions | undefined, callback: QRCodeErrorCallback): void
export function toFileStream (stream: Writable, text: QRCodeInput, opts?: any): void {
  if (arguments.length < 2) {
    throw new Error('Too few arguments provided')
  }

  const params = checkParams(text, opts, stream.emit.bind(stream, 'error'))
  const renderer = getRendererFromType('png') as typeof PngRenderer // Only png support for now
  const renderToFileStream = renderer.renderToFileStream.bind(null, stream)
  render(renderToFileStream, text, params)
}

/** Render one QR per item on a printable PDF grid, adding pages as needed. */
export function toPdf (texts: QRCodeInput[], callback: QRCodeCallback<Buffer>): void
export function toPdf (texts: QRCodeInput[], options?: QRCodeToPdfOptions): Promise<Buffer>
export function toPdf (texts: QRCodeInput[], options: QRCodeToPdfOptions | undefined, callback: QRCodeCallback<Buffer>): void
export function toPdf (texts: QRCodeInput[], opts?: any, cb?: any): any {
  if (!Array.isArray(texts) || !texts.length) {
    throw new Error('toPdf requires a non-empty array of texts')
  }
  const params = checkParams(texts, opts, cb)
  function run (done: Callback): void {
    let buffer: Buffer
    try {
      const qrDataList = texts.map(function (text, i) {
        try {
          return QRCode.create(text, params.opts)
        } catch (e) {
          (e as Error).message = 'Item ' + (i + 1) + ': ' + (e as Error).message
          throw e
        }
      })
      buffer = PdfRenderer.renderMany(qrDataList, params.opts)
    } catch (e) {
      done(e)
      return
    }
    done(null, buffer)
  }
  if (!params.cb) {
    return new Promise<Buffer>(function (resolve, reject) {
      run(function (err, buffer) { return err ? reject(err) : resolve(buffer) })
    })
  }
  run(params.cb)
}

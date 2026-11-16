import * as fs from 'fs'
import { PNG } from 'pngjs'
import type { PNGOptions } from 'pngjs'
import * as Utils from './utils'
import type { QRCode } from '../types'
import type { RendererOptionsInput } from './utils'

type Callback<T> = (error: Error | null, result?: T) => void

export function render (qrData: QRCode, options?: RendererOptionsInput): PNG {
  const opts = Utils.getOptions(options)
  const pngOpts = opts.rendererOpts
  const size = Utils.getImageWidth(qrData.modules.size, opts)

  pngOpts.width = size
  pngOpts.height = size

  const pngImage = new PNG(pngOpts as PNGOptions)
  Utils.qrToImageData(pngImage.data, qrData, opts)

  return pngImage
}

export function renderToDataURL (qrData: QRCode, cb: Callback<string>): void
export function renderToDataURL (qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback<string>): void
export function renderToDataURL (qrData: QRCode, options: RendererOptionsInput | Callback<string> | undefined, cb?: Callback<string>): void {
  if (typeof cb === 'undefined') {
    cb = options as Callback<string>
    options = undefined
  }
  const done = cb

  renderToBuffer(qrData, options as RendererOptionsInput | undefined, function (err, output) {
    if (err) return done(err)
    let url = 'data:image/png;base64,'
    url += (output as Buffer).toString('base64')
    done(null, url)
  })
}

export function renderToBuffer (qrData: QRCode, cb: Callback<Buffer>): void
export function renderToBuffer (qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback<Buffer>): void
export function renderToBuffer (qrData: QRCode, options: RendererOptionsInput | Callback<Buffer> | undefined, cb?: Callback<Buffer>): void {
  if (typeof cb === 'undefined') {
    cb = options as Callback<Buffer>
    options = undefined
  }
  const done = cb

  const png = render(qrData, options as RendererOptionsInput | undefined)
  const buffer: Buffer[] = []

  png.on('error', done)

  png.on('data', function (data: Buffer) {
    buffer.push(data)
  })

  png.on('end', function () {
    done(null, Buffer.concat(buffer))
  })

  png.pack()
}

export function renderToFile (path: string, qrData: QRCode, cb: Callback<void>): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | undefined, cb: Callback<void>): void
export function renderToFile (path: string, qrData: QRCode, options: RendererOptionsInput | Callback<void> | undefined, cb?: Callback<void>): void {
  if (typeof cb === 'undefined') {
    cb = options as Callback<void>
    options = undefined
  }
  const done = cb

  let called = false
  const once = (...args: unknown[]) => {
    if (called) return
    called = true
    done.apply(null, args as Parameters<Callback<void>>)
  }
  const stream = fs.createWriteStream(path)

  stream.on('error', once)
  stream.on('close', once)

  renderToFileStream(stream, qrData, options as RendererOptionsInput | undefined)
}

export function renderToFileStream (stream: NodeJS.WritableStream, qrData: QRCode, options?: RendererOptionsInput): void {
  const png = render(qrData, options)
  png.pack().pipe(stream)
}

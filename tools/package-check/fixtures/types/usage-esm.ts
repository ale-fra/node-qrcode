// Public API, used as with @types/qrcode, ES module syntax (must compile against both typings)
import QRCode from 'qrcode'
import * as QR from 'qrcode'
import { create, toCanvas, toDataURL, toString, toFile, toFileStream, toBuffer } from 'qrcode'
import type {
  QRCode as QRCodeSymbol, QRCodeOptions, QRCodeRenderersOptions, QRCodeToDataURLOptions,
  QRCodeToStringOptions, QRCodeToFileOptions, QRCodeSegment, QRCodeErrorCorrectionLevel, QRCodeMaskPattern,
  QRCodeToBufferOptions, QRCodeToFileStreamOptions, GeneratedQRCodeSegment, BitMatrix, ErrorCorrectionLevel
} from 'qrcode'
import toSJIS from 'qrcode/helper/to-sjis'
import { PassThrough } from 'stream'

declare const canvas: HTMLCanvasElement

// create
const opts: QRCodeOptions = { version: 5, errorCorrectionLevel: 'H', maskPattern: 3, toSJISFunc: toSJIS }
const qr: QRCodeSymbol = create('text', opts)
const size: number = qr.modules.size
const bit: number = qr.modules.get(0, 0)
const mask: QRCodeMaskPattern | undefined = qr.maskPattern
const ecl: ErrorCorrectionLevel = qr.errorCorrectionLevel
const segs: GeneratedQRCodeSegment[] = qr.segments
const len: number = segs[0].getLength() + segs[0].getBitsLength()
const matrix: BitMatrix = qr.modules
const segments: QRCodeSegment[] = [
  { data: 'ABC', mode: 'alphanumeric' }, { data: 123, mode: 'numeric' },
  { data: new Uint8Array([1, 2]), mode: 'byte' }, { data: '漢字', mode: 'kanji' }, { data: 'plain' }
]
create(segments)
QRCode.create('x')
QR.create('x', { errorCorrectionLevel: 'low' as QRCodeErrorCorrectionLevel })

// toCanvas
toCanvas(canvas, 'text', (err) => { if (err) throw err })
toCanvas(canvas, 'text', { margin: 2, color: { dark: '#000', light: '#fff' } }, (err) => { if (err) throw err })
toCanvas(canvas, 'text').then(() => {})
toCanvas('text', (err, c) => { if (err) throw err; c.getContext('2d') })
toCanvas('text', { width: 200 }).then((c) => c.toDataURL())

// toDataURL (server and browser forms)
const dataUrlOpts: QRCodeToDataURLOptions = { type: 'image/jpeg', rendererOpts: { quality: 0.3 } }
toDataURL('text', (err, url) => { if (err) throw err; url.toUpperCase() })
toDataURL('text', dataUrlOpts, (err, url) => { if (err) throw err; url.toUpperCase() })
toDataURL('text', { type: 'image/png', scale: 8 }).then((url) => url.toUpperCase())
toDataURL(canvas, 'text', (err, url) => { if (err) throw err; url.toUpperCase() })
toDataURL(canvas, 'text', dataUrlOpts).then((url: string) => url)
QRCode.toDataURL('text').then((url) => url)

// toString
const strOpts: QRCodeToStringOptions = { type: 'terminal', small: true }
toString('text', (err, s) => { if (err) throw err; s.trim() })
toString('text', strOpts, (err, s) => { if (err) throw err; s.trim() })
toString('text', { type: 'svg' }).then((s) => s.trim())

// toFile
const fileOpts: QRCodeToFileOptions = { type: 'png', rendererOpts: { deflateLevel: 9 } }
toFile('out.png', 'text', (err) => { if (err) throw err })
toFile('out.png', 'text', fileOpts, (err) => { if (err) throw err })
toFile('out.svg', 'text', { type: 'svg' }).then(() => {})

// toBuffer
const bufOpts: QRCodeToBufferOptions = { type: 'png', margin: 1 }
toBuffer('text', (err, buf) => { if (err) throw err; return buf.byteLength })
toBuffer('text', bufOpts).then((buf: Buffer) => buf.byteLength)

// toFileStream
const fsOpts: QRCodeToFileStreamOptions = { type: 'png' }
toFileStream(new PassThrough(), 'text', fsOpts)
toFileStream(new PassThrough(), 'text')

const renderersOptions: QRCodeRenderersOptions = { margin: 0, scale: 1, width: 100 }
export { size, bit, mask, ecl, len, matrix, renderersOptions }

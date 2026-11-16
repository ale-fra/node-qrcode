import * as QR from 'qrcode'
import type { QRCodeToPdfOptions, QRCodeToBufferOptions, QRCodeToDataURLOptions, QRCodeToFileOptions, QRCodeInput, QRCodeDataURLType } from 'qrcode'
import * as Browser from 'qrcode/lib/browser'

const options: QRCodeToPdfOptions = {
  errorCorrectionLevel: 'H',
  margin: 2,
  rendererOpts: { pageSize: 'Letter', size: 30, gap: 4, top: 10, left: 10, columns: 3, rows: 4 }
}
const texts: QRCodeInput[] = ['one', [{ data: 'TWO', mode: 'alphanumeric' }]]
const pdf: Promise<Buffer> = QR.toPdf(texts, options)
QR.toPdf(texts, (_err, buffer) => buffer.subarray(0, 8))
QR.toPdf(texts, options, (_err, buffer) => buffer.subarray(0, 8))
const defaultPdf: Promise<Buffer> = QR.default.toPdf(texts)
const bufferOptions: QRCodeToBufferOptions = { type: 'pdf', rendererOpts: { size: 40 } }
const pdfType: QRCodeDataURLType = 'application/pdf'
const dataOptions: QRCodeToDataURLOptions = { type: pdfType, rendererOpts: { pageSize: 'A3' } }
const fileOptions: QRCodeToFileOptions = { rendererOpts: { size: 30, left: 12 } }
const buffer: Promise<Buffer> = QR.toBuffer('one', bufferOptions)
const url: Promise<string> = QR.toDataURL('one', dataOptions)
const file: Promise<void> = QR.toFile('one.pdf', 'one', fileOptions)
QR.toFile('one.pdf', 'one', { type: 'pdf', rendererOpts: { size: 40 } }, (_err) => {})
// @ts-expect-error: batch requires an array of inputs
QR.toPdf('one')
// @ts-expect-error: batch items must be strings or segment arrays
QR.toPdf([123])
// @ts-expect-error: dimensions must be numbers
QR.toPdf(['one'], { rendererOpts: { size: '40' } })
// @ts-expect-error: browser entry point has no Node-only PDF batch API
Browser.toPdf(['one'])
// @ts-expect-error: browser supports raster data URLs, not PDF
Browser.toDataURL('one', { type: 'pdf' })
// @ts-expect-error: PDF is not a supported string renderer
QR.toString('one', { type: 'pdf' })
// @ts-expect-error: file streams remain PNG only
QR.toFileStream({} as import('stream').Writable, 'one', { type: 'pdf' })
export { pdf, defaultPdf, buffer, url, file }

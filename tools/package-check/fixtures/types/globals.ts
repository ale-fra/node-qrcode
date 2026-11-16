// Browser bundles used with <script> tags: types of the QRCode global
/// <reference types="qrcode/build/qrcode" />
/// <reference types="qrcode/build/qrcode.tosjis" />

declare const canvas: HTMLCanvasElement

QRCode.toCanvas(canvas, 'text', { margin: 1 }, (err) => { if (err) throw err })
QRCode.toDataURL('text').then((url: string) => url.toUpperCase())
QRCode.toString('text', (err, svg) => { if (err) throw err; svg.trim() })
const version: number = QRCode.create('text', { toSJISFunc: QRCode.toSJIS }).version

// @ts-expect-error: server only API (not in the browser bundle)
QRCode.toFile('out.png', 'text')

export { version }

// @ts-expect-error: browser global does not expose Node-only PDF methods
QRCode.toPdf(['one'])
// @ts-expect-error: browser global does not render PDF data URLs
QRCode.toDataURL('one', { type: 'pdf' })

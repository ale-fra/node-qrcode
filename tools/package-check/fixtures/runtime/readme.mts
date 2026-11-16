// TypeScript example of the README (run by Node.js with type stripping)
import assert from 'node:assert'
import QRCode from 'qrcode'
import type { QRCodeToDataURLOptions } from 'qrcode'

const options: QRCodeToDataURLOptions = { errorCorrectionLevel: 'H', margin: 2 }
const url: string = await QRCode.toDataURL('I am a pony!', options)
assert.ok(url.startsWith('data:image/png;base64,'))

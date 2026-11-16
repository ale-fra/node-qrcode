// Bundled for the browser (the "browser" field selects lib/browser.js)
import QRCode from 'qrcode'
import { toString as namedToString } from 'qrcode'

window.result = { keys: Object.keys(QRCode).sort(), sameFunctions: namedToString === QRCode.toString }
QRCode.toString('bundled', { margin: 1 }).then((svg) => { window.result.svg = svg.slice(0, 4) })

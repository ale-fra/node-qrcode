// Bundled for the browser (the "browser" field selects lib/browser.js)
const QRCode = require('qrcode')

window.result = { keys: Object.keys(QRCode).sort(), sameFunctions: QRCode.default.toString === QRCode.toString }
QRCode.toString('bundled', { margin: 1 }, function (err, svg) { window.result.svg = err ? err.message : svg.slice(0, 4) })

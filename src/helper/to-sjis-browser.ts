// Entry point of the browser bundle build/qrcode.tosjis.js.
// Intentionally a script (no import/export): it only extends the QRCode
// global defined by build/qrcode.js and exports nothing.

// QRCode is the global defined by the browser bundle (build/qrcode.js)
declare const QRCode: { toSJIS?: typeof import('./to-sjis') }

QRCode.toSJIS = require('./to-sjis')

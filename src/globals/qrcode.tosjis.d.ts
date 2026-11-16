/**
 * Types of the function added to the QRCode global by build/qrcode.tosjis.js.
 *
 * Usage: /// <reference types="qrcode/build/qrcode.tosjis" />
 *
 * Copied to build/qrcode.tosjis.d.ts by the bundle build (rollup.config.ts).
 */
import toSJISFunc = require('../helper/to-sjis')

declare global {
  namespace QRCode {
    const toSJIS: typeof toSJISFunc
  }
}

export {}

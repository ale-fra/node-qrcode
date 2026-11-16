/**
 * Types of the global defined by the browser bundle (build/qrcode.js).
 *
 * Usage: /// <reference types="qrcode/build/qrcode" />
 *
 * Copied to build/qrcode.d.ts by the bundle build (rollup.config.ts).
 */
import type * as QRCodeBrowser from '../lib/browser'

declare global {
  namespace QRCode {
    const create: typeof QRCodeBrowser.create
    const toCanvas: typeof QRCodeBrowser.toCanvas
    const toDataURL: typeof QRCodeBrowser.toDataURL
    const toString: typeof QRCodeBrowser.toString
  }
}

export {}

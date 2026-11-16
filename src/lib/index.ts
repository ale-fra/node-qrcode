/*
* Copyright notice in the license file.
*
* Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
*
* this is the main server side application file for node-qrcode.
* these exports use serverside canvas api methods for file IO and buffers
*
* Note: bundlers replace this module with ./browser (see "browser" field in
* package.json), so the exported types cover both environments.
*/

import * as server from './server'
import type * as browser from './browser'

export type * from './types'
export type { CanvasLike } from './renderer/canvas'

export const create: typeof server.create = server.create

export const toCanvas: typeof server.toCanvas = server.toCanvas

export const toString: typeof server.toString = server.toString

/**
 * Returns a Data URI containing a representation of the QR Code image.
 *
 * Node.js: png only. Browser: png, jpeg or webp, canvas element can be provided.
 */
export const toDataURL: typeof server.toDataURL & typeof browser.toDataURL = server.toDataURL as typeof server.toDataURL & typeof browser.toDataURL

export const toBuffer: typeof server.toBuffer = server.toBuffer

export const toFile: typeof server.toFile = server.toFile

export const toFileStream: typeof server.toFileStream = server.toFileStream

/**
 * Default export: allows `import QRCode from 'qrcode'`
 * (Babel, webpack and TypeScript with esModuleInterop)
 *
 * Note: server.* is referenced instead of the exported constants, since
 * TypeScript compiles references to exported variables to `exports.*`, which
 * prevents tools from detecting the named exports of this module
 */
export default {
  create: server.create,
  toCanvas: server.toCanvas,
  toString: server.toString,
  toDataURL: server.toDataURL as typeof toDataURL,
  toBuffer: server.toBuffer,
  toFile: server.toFile,
  toFileStream: server.toFileStream
}

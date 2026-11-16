/**
 * Callbacks of the public API (Node.js style: error first)
 */

export type QRCodeCallback<T> = (error: Error | null | undefined, result: T) => void
export type QRCodeErrorCallback = (error: Error | null | undefined) => void

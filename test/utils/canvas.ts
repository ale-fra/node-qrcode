import { createCanvas } from '@napi-rs/canvas'

type DocumentMock = Pick<Document, 'createElement'>

/**
 * Mocks the global `document` object, so that the library can create
 * canvas elements (with @napi-rs/canvas)
 */
export function mockDocument (): void {
  const document = {
    createElement: function (el: string) {
      if (el === 'canvas') {
        return createCanvas(200, 200)
      }
    }
  }
  ;(globalThis as { document?: DocumentMock }).document = document as unknown as DocumentMock
}

/**
 * Removes the global `document` mock
 */
export function unmockDocument (): void {
  ;(globalThis as { document?: DocumentMock }).document = undefined
}

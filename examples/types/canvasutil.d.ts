// Minimal declarations for canvasutil (used by the clientsideserver example)
declare module 'canvasutil' {
  interface Pixel {
    r: number
    g: number
    b: number
    a: number
  }

  type PixelCallback = (px: Pixel, i: number, len: number, pixels: Uint8ClampedArray,
    width: number, height: number, pixelCore: PixelCore) => boolean | void

  class PixelCore {
    threshold: number
    iterate (canvas: unknown, cb: PixelCallback): void
  }

  interface ConversionLib {
    luma709Only (r: number, g: number, b: number): number
    rgbToYuv (r: number, g: number, b: number): [number, number, number]
    yuvToRgb (y: number, u: number, v: number): [number, number, number]
  }

  const canvasutil: { PixelCore: typeof PixelCore, conversionLib: ConversionLib }
  export default canvasutil
}

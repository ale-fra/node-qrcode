import { PNG } from 'pngjs'

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,'

/**
 * Decodes a PNG data URL (returns undefined if the value is not a PNG data URL)
 */
export function decodePngDataURL (url: unknown): PNG | undefined {
  if (typeof url !== 'string' || url.indexOf(PNG_DATA_URL_PREFIX) !== 0) return undefined
  return PNG.sync.read(Buffer.from(url.slice(PNG_DATA_URL_PREFIX.length), 'base64'))
}

/**
 * Asserts that two PNG data URLs contain the same image.
 *
 * Canvas-generated PNGs are compared by decoded pixels rather than by bytes:
 * different canvas implementations (node-canvas/cairo, @napi-rs/canvas/skia,
 * browsers) use different PNG encoders, so identical images can be encoded
 * to different byte streams.
 * A single assertion is made, so that t.plan() counts are not affected.
 */
export function assertSamePng (t: Tap.Test, actualUrl: unknown, expectedUrl: string, message: string): void {
  const actual = decodePngDataURL(actualUrl)
  if (!actual) {
    t.fail(message + ' (not a PNG data URL)')
    return
  }

  const expected = decodePngDataURL(expectedUrl) as PNG
  t.ok(actual.width === expected.width &&
    actual.height === expected.height &&
    actual.data.equals(expected.data), message)
}

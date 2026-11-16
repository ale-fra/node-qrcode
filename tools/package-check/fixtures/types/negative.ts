// Invalid uses of the public API: each one must be rejected by the types
import { create, toString, toDataURL, toFile, toBuffer } from 'qrcode'

// @ts-expect-error: text must be a string or segments
create(123)
// @ts-expect-error: unknown error correction level
create('x', { errorCorrectionLevel: 'X' })
// @ts-expect-error: mask pattern is 0-7
create('x', { maskPattern: 8 })
// @ts-expect-error: png is not a string type
toString('x', { type: 'png' })
// @ts-expect-error: unsupported data url type
toDataURL('x', { type: 'image/gif' })
// @ts-expect-error: toBuffer only supports png
toBuffer('x', { type: 'svg' })
// @ts-expect-error: path is required
toFile('x')
// @ts-expect-error: callback receives a string
toString('x', (_err, s: number) => s)
// @ts-expect-error: segment mode must be valid
create([{ data: 'x', mode: 'binary' }])

// ES module consumer (Node.js): default and named imports of the CommonJS package
import assert from 'node:assert'
import QRCode, { toString, create, toFile } from 'qrcode'
import toSJIS from 'qrcode/helper/to-sjis.js'

assert.strictEqual(typeof QRCode.toString, 'function')
assert.strictEqual(toString, QRCode.toString, 'named and default imports are the same functions')
assert.strictEqual(typeof toFile, 'function')
assert.strictEqual(create('漢字', { toSJISFunc: toSJIS }).segments[0].mode.id, 'Kanji')
assert.ok((await toString('hi', { type: 'svg' })).startsWith('<svg'))

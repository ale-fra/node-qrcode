// CommonJS consumer: require() of the package, deep imports and helpers
const assert = require('node:assert')
const QRCode = require('qrcode')
const toSJIS = require('qrcode/helper/to-sjis')
const BitBuffer = require('qrcode/lib/core/bit-buffer')

assert.deepStrictEqual(Object.keys(QRCode).sort(),
  ['create', 'default', 'toBuffer', 'toCanvas', 'toDataURL', 'toFile', 'toFileStream', 'toString'])
assert.strictEqual(QRCode.default.toString, QRCode.toString, 'default export has the same functions')
assert.ok(QRCode.toString('hi', { type: 'svg' }, () => {}).startsWith('<svg'))
assert.strictEqual(typeof toSJIS, 'function', 'helper/to-sjis exports a function')
assert.strictEqual(toSJIS('漢'), 0x8ABF)
assert.strictEqual(new BitBuffer().getLengthInBits(), 0, 'class modules export the class')

QRCode.toDataURL('hi').then((url) => {
  assert.ok(url.startsWith('data:image/png;base64,'))
})

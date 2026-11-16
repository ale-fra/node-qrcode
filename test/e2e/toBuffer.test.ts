import { test } from 'tap'
import { PNG } from 'pngjs'
import * as QRCode from '../../lib'
import { removeNativePromise, restoreNativePromise } from '../utils/native-promise'

test('toBuffer - no promise available', function (t) {
  removeNativePromise()

  // @ts-expect-error: missing arguments
  t.throws(function () { QRCode.toBuffer() },
    'Should throw if text is not provided')

  t.throws(function () { QRCode.toBuffer('some text') },
    'Should throw if a callback is not provided')

  t.throws(function () { QRCode.toBuffer('some text', {}) },
    'Should throw if a callback is not a function')

  t.end()

  restoreNativePromise()
})

test('toBuffer', function (t) {
  t.plan(10)

  // @ts-expect-error: missing arguments
  t.throws(function () { QRCode.toBuffer() },
    'Should throw if text is not provided')

  QRCode.toBuffer('i am a pony!', function (err, buffer) {
    t.ok(!err, 'There should be no error')
    t.ok(Buffer.isBuffer(buffer), 'Should return a Buffer')

    const png = PNG.sync.read(buffer)
    // version 1 (21 modules), default margin 4, default scale 4
    t.equal(png.width, (21 + 4 * 2) * 4, 'Should be a valid PNG with default size')
  })

  QRCode.toBuffer('i am a pony!', {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 1,
    scale: 1
  }, function (err, buffer) {
    t.ok(!err, 'There should be no error')
    t.equal(PNG.sync.read(buffer).width, 25 + 1 * 2,
      'Should apply options (version 2 with EC level H, margin 1, scale 1)')
  })

  QRCode.toBuffer('i am a pony!', { version: 1, errorCorrectionLevel: 'H' },
    function (err, buffer) {
      t.ok(err, 'Should return an error if data does not fit')
      t.notOk(buffer, 'Buffer should be undefined on error')
    })

  QRCode.toBuffer('i am a pony!').then(function (buffer) {
    t.ok(Buffer.isBuffer(buffer), 'Should return a Buffer (promise)')
  })

  QRCode.toBuffer('i am a pony!', { version: 1, errorCorrectionLevel: 'H' })
    .catch(function (err) {
      t.ok(err, 'Should reject if data does not fit (promise)')
    })
})

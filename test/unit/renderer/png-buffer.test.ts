import { test } from 'tap'
import { PNG } from 'pngjs'
import * as QRCode from '../../../lib/core/qrcode'
import * as PngRenderer from '../../../lib/renderer/png'

test('PNG renderToBuffer', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })

  t.plan(5)

  PngRenderer.renderToBuffer(sampleQrData, function (err, buffer) {
    t.ok(!err, 'Should not generate errors with only qrData param')
    t.ok(Buffer.isBuffer(buffer), 'Should return a Buffer')
    // modules: 25, margins: 4 * 2, scale: 4
    t.equal(PNG.sync.read(buffer as Buffer).width, (25 + 4 * 2) * 4,
      'Should use default options')
  })

  PngRenderer.renderToBuffer(sampleQrData, { margin: 10, scale: 1 },
    function (err, buffer) {
      t.ok(!err, 'Should not generate errors with options param')
      t.equal(PNG.sync.read(buffer as Buffer).width, 25 + 10 * 2,
        'Should apply options')
    })
})

test('PNG renderToDataURL - render error', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  let calls = 0

  // A scale this small produces a 0x0 image, which pngjs refuses to pack
  t.doesNotThrow(function () {
    PngRenderer.renderToDataURL(sampleQrData, { scale: 0.001 }, function (err, url) {
      calls++
      t.ok(err, 'Should return an error')
      t.notOk(url, 'Should not return an url')
    })
  }, 'Should not throw after reporting the error')

  t.equal(calls, 1, 'Should call the callback exactly once')
  t.end()
})

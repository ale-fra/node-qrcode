import { test } from 'tap'
import * as sinon from 'sinon'
import * as QRCode from '../../lib'
import { WritableStreamMock } from '../utils/writable-stream-mock'

test('toFileStream png', function (t) {
  // @ts-expect-error: missing arguments
  t.throws(function () { QRCode.toFileStream('some text') },
    'Should throw if stream is not provided')

  // @ts-expect-error: missing arguments
  t.throws(function () { QRCode.toFileStream(new WritableStreamMock()) },
    'Should throw if text is not provided')

  const fstream = new WritableStreamMock()
  const spy = sinon.spy(fstream, 'emit')

  QRCode.toFileStream(fstream, 'i am a pony!')

  QRCode.toFileStream(fstream, 'i am a pony!', {
    type: 'image/png'
  })

  t.ok(spy.neverCalledWith('error'),
    'There should be no error')

  spy.restore()
  t.end()
})

test('toFileStream png with write error', function (t) {
  const fstreamErr = new WritableStreamMock().forceErrorOnWrite()
  QRCode.toFileStream(fstreamErr, 'i am a pony!')

  t.plan(2)

  fstreamErr.on('error', function (e) {
    t.ok(e, 'Should return an error')
  })
})

test('toFileStream png with qrcode error', function (t) {
  const fstreamErr = new WritableStreamMock()
  const bigString = Array(200).join('i am a pony!')

  t.plan(2)

  fstreamErr.on('error', function (e) {
    t.ok(e, 'Should return an error')
  })

  QRCode.toFileStream(fstreamErr, bigString)
  QRCode.toFileStream(fstreamErr, 'i am a pony!', {
    version: 1, // force version=1 to trigger an error
    errorCorrectionLevel: 'H'
  })
})

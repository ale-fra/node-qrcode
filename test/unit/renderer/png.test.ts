import { test } from 'tap'
import * as sinon from 'sinon'
// a plain require() is needed: the tests replace (stub) functions of the module
import fs = require('fs')
import * as QRCode from '../../../lib/core/qrcode'
import * as PngRenderer from '../../../lib/renderer/png'
import { PNG } from 'pngjs'
import { WritableStreamMock } from '../../utils/writable-stream-mock'

test('PNG renderer interface', function (t) {
  t.type(PngRenderer.render, 'function',
    'Should have render function')

  t.type(PngRenderer.renderToDataURL, 'function',
    'Should have renderToDataURL function')

  t.type(PngRenderer.renderToFile, 'function',
    'Should have renderToFile function')

  t.type(PngRenderer.renderToFileStream, 'function',
    'Should have renderToFileStream function')

  t.end()
})

test('PNG render', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  let png!: PNG

  t.doesNotThrow(function () { png = PngRenderer.render(sampleQrData) },
    'Should not throw with only qrData param')

  t.ok(png instanceof PNG,
    'Should return an instance of PNG')

  t.equal(png.width, png.height,
    'Should be a square image')

  // modules: 25, margins: 4 * 2, scale: 4
  t.equal(png.width, (25 + 4 * 2) * 4,
    'Should have correct size')

  t.doesNotThrow(function () {
    png = PngRenderer.render(sampleQrData, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')

  t.equal(png.width, png.height,
    'Should be a square image')

  // modules: 25, margins: 10 * 2, scale: 1
  t.equal(png.width, 25 + 10 * 2,
    'Should have correct size')

  t.end()
})

test('PNG renderToDataURL', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })

  t.plan(6)

  PngRenderer.renderToDataURL(sampleQrData, function (err, url) {
    t.ok(!err,
      'Should not generate errors with only qrData param')

    t.type(url, 'string',
      'Should return a string')
  })

  PngRenderer.renderToDataURL(sampleQrData, { margin: 10, scale: 1 },
    function (err, url) {
      t.ok(!err, 'Should not generate errors with options param')

      t.type(url, 'string',
        'Should return a string')

      t.equal((url as string).split(',')[0], 'data:image/png;base64',
        'Should have correct header')

      const b64png = (url as string).split(',')[1]
      t.equal(b64png.length % 4, 0,
        'Should have a correct length')
    }
  )
})

test('PNG renderToFile', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const fileName = 'qrimage.png'
  let fsStub = sinon.stub(fs, 'createWriteStream')
  fsStub.returns(new WritableStreamMock() as unknown as fs.WriteStream)

  t.plan(5)

  PngRenderer.renderToFile(fileName, sampleQrData, function (err) {
    t.ok(!err,
      'Should not generate errors with only qrData param')

    t.equal(fsStub.getCall(0).args[0], fileName,
      'Should save file with correct file name')
  })

  PngRenderer.renderToFile(fileName, sampleQrData, {
    margin: 10,
    scale: 1
  }, function (err) {
    t.ok(!err,
      'Should not generate errors with options param')

    t.equal(fsStub.getCall(0).args[0], fileName,
      'Should save file with correct file name')
  })

  fsStub.restore()
  fsStub = sinon.stub(fs, 'createWriteStream')
  fsStub.returns(new WritableStreamMock().forceErrorOnWrite() as unknown as fs.WriteStream)

  PngRenderer.renderToFile(fileName, sampleQrData, function (err) {
    t.ok(err,
      'Should fail if error occurs during save')
  })

  fsStub.restore()
})

test('PNG renderToFileStream', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })

  t.doesNotThrow(function () {
    PngRenderer.renderToFileStream(new WritableStreamMock(), sampleQrData)
  }, 'Should not throw with only qrData param')

  t.doesNotThrow(function () {
    PngRenderer.renderToFileStream(new WritableStreamMock(), sampleQrData, {
      margin: 10,
      scale: 1
    })
  }, 'Should not throw with options param')

  t.end()
})

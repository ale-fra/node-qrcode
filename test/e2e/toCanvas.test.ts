import { test } from 'tap'
import { mockDocument, unmockDocument } from '../utils/canvas'
import { Canvas, createCanvas } from '@napi-rs/canvas'
import * as QRCode from '../../lib'
import { removeNativePromise, restoreNativePromise } from '../utils/native-promise'

test('toCanvas - no promise available', function (t) {
  removeNativePromise()

  mockDocument()
  const canvasEl = createCanvas(200, 200)

  // @ts-expect-error: missing arguments
  t.throws(function () { QRCode.toCanvas() },
    'Should throw if no arguments are provided')

  t.throws(function () { QRCode.toCanvas('some text') },
    'Should throw if a callback is not provided')

  t.throws(function () { QRCode.toCanvas(canvasEl, 'some text') },
    'Should throw if a callback is not provided')

  t.throws(function () { QRCode.toCanvas(canvasEl, 'some text', {}) },
    'Should throw if callback is not a function')

  t.end()

  unmockDocument()
  restoreNativePromise()
})

test('toCanvas', function (t) {
  mockDocument()

  t.plan(7)

  // @ts-expect-error: missing arguments
  t.throws(function () { QRCode.toCanvas() },
    'Should throw if no arguments are provided')

  QRCode.toCanvas('some text', function (err, canvasEl) {
    t.ok(!err, 'There should be no error')
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object')
  })

  QRCode.toCanvas('some text', {
    errorCorrectionLevel: 'H'
  }, function (err, canvasEl) {
    t.ok(!err, 'There should be no error')
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object')
  })

  QRCode.toCanvas('some text').then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object (promise)')
  })

  QRCode.toCanvas('some text', {
    errorCorrectionLevel: 'H'
  }).then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object (promise)')
  })

  unmockDocument()
})

test('toCanvas with specified canvas element', function (t) {
  const canvasEl = createCanvas(200, 200)

  t.plan(6)

  QRCode.toCanvas(canvasEl, 'some text', function (err, canvasEl) {
    t.ok(!err, 'There should be no error')
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object')
  })

  QRCode.toCanvas(canvasEl, 'some text', {
    errorCorrectionLevel: 'H'
  }, function (err, canvasEl) {
    t.ok(!err, 'There should be no error')
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object')
  })

  QRCode.toCanvas(canvasEl, 'some text').then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object (promise)')
  })

  QRCode.toCanvas(canvasEl, 'some text', {
    errorCorrectionLevel: 'H'
  }).then(function (canvasEl) {
    t.ok(canvasEl instanceof Canvas,
      'Should return a new canvas object (promise)')
  })
})

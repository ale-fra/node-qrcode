import { test } from 'tap'
import toSJIS = require('../../../helper/to-sjis')

interface QRCodeGlobal {
  QRCode?: { toSJIS?: unknown }
}

test('to-sjis-browser', function (t) {
  // global defined by the browser bundle (build/qrcode.js)
  const global = globalThis as QRCodeGlobal
  global.QRCode = {}

  require('../../../helper/to-sjis-browser')

  t.equal(global.QRCode.toSJIS, toSJIS, 'Should add toSJIS() to the QRCode global')

  delete global.QRCode
  t.end()
})

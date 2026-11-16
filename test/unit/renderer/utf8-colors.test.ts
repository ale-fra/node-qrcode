import { test } from 'tap'
import * as QRCode from '../../../lib/core/qrcode'
import * as Utf8Renderer from '../../../lib/renderer/utf8'

test('Utf8Renderer inverted colors', function (t) {
  const sampleQrData = QRCode.create('sample text', { version: 2 })
  const invert: Record<string, string> = { ' ': '█', '█': ' ', '▀': '▄', '▄': '▀', '\n': '\n' }

  const normal = Utf8Renderer.render(sampleQrData)
  const expectedInverted = normal.split('').map(function (c) {
    return invert[c]
  }).join('')

  t.equal(Utf8Renderer.render(sampleQrData, {
    color: { dark: '#ffffff', light: '#000000' }
  }), expectedInverted, 'Should invert blocks with white on black')

  t.equal(Utf8Renderer.render(sampleQrData, {
    color: { dark: '#ffffff' }
  }), expectedInverted, 'Should invert blocks if dark color is white')

  t.equal(Utf8Renderer.render(sampleQrData, {
    color: { light: '#000000' }
  }), expectedInverted, 'Should invert blocks if light color is black')

  t.end()
})

import { test } from 'tap'
import { getOptions } from '../../../../bin/cli/options'

test('CLI options - all arguments', function (t) {
  t.same(getOptions({
    _: ['text'],
    qversion: 5,
    error: 'H',
    type: 'svg',
    small: true,
    inverse: true,
    mask: 3,
    qzone: 2,
    width: 200,
    scale: 8,
    lightcolor: '#fff',
    darkcolor: '#000',
    output: 'out.svg'
  }), {
    version: 5,
    errorCorrectionLevel: 'H',
    type: 'svg',
    small: true,
    inverse: true,
    maskPattern: 3,
    margin: 2,
    width: 200,
    scale: 8,
    color: { light: '#fff', dark: '#000' }
  }, 'Should map each argument to the corresponding library option')

  t.end()
})

test('CLI options - no arguments', function (t) {
  const options = getOptions({ _: [] })

  t.equal(options.small, false, 'Should set small to false')
  t.equal(options.inverse, false, 'Should set inverse to false')
  t.same(options.color, { light: undefined, dark: undefined }, 'Should always set colors')
  t.equal(options.version, undefined, 'Should leave other options undefined')

  t.end()
})

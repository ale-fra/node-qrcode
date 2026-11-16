import { test } from 'tap'
import * as QRCode from '../../lib'

const unsupportedTypes = ['svg', 'utf8', 'txt']

test('toDataURL - unsupported type', function (t) {
  t.plan(unsupportedTypes.length * 4)

  unsupportedTypes.forEach(function (type) {
    // @ts-expect-error: unsupported type (checked at runtime)
    QRCode.toDataURL('i am a pony!', { type }, function (err, url) {
      t.match(err && err.message, 'Type "' + type + '" is not supported by toDataURL()',
        'Should return a meaningful error for type ' + type)
      t.notOk(url, 'Should not return an url for type ' + type)
    })

    // @ts-expect-error: unsupported type (checked at runtime)
    QRCode.toDataURL('i am a pony!', { type }).then(function () {
      t.fail('Should not resolve for type ' + type)
    }, function (err) {
      t.match(err.message, 'Type "' + type + '" is not supported by toDataURL()',
        'Should reject with a meaningful error for type ' + type + ' (promise)')
      t.pass()
    })
  })
})

test('toBuffer - unsupported type', function (t) {
  t.plan(unsupportedTypes.length * 3)

  unsupportedTypes.forEach(function (type) {
    // @ts-expect-error: unsupported type (checked at runtime)
    QRCode.toBuffer('i am a pony!', { type }, function (err, buffer) {
      t.match(err && err.message, 'Type "' + type + '" is not supported by toBuffer()',
        'Should return a meaningful error for type ' + type)
      t.notOk(buffer, 'Should not return a buffer for type ' + type)
    })

    // @ts-expect-error: unsupported type (checked at runtime)
    QRCode.toBuffer('i am a pony!', { type }).catch(function (err) {
      t.match(err.message, 'Type "' + type + '" is not supported by toBuffer()',
        'Should reject with a meaningful error for type ' + type + ' (promise)')
    })
  })
})

test('toDataURL - render error', function (t) {
  let calls = 0

  QRCode.toDataURL('i am a pony!', { scale: 0.001 }, function (err, url) {
    calls++
    t.ok(err, 'Should return an error')
    t.notOk(url, 'Should not return an url')
  })

  t.equal(calls, 1, 'Should call the callback exactly once')
  t.end()
})

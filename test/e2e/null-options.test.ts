import { test } from 'tap'
import { tempDir } from '../utils/tmp'
import * as fs from 'fs'
import * as path from 'path'
import * as QRCode from '../../lib'

test('null options are treated as omitted options', function (t) {
  t.plan(9)

  // @ts-expect-error: null options are not part of the API, but tolerated at runtime
  QRCode.toString('i am a pony!', null, function (err, str) {
    t.ok(!err, 'toString: there should be no error')
    t.equal(str, QRCode.toString('i am a pony!', function () {}),
      'toString: should produce the default output')
  })

  // @ts-expect-error: null options are not part of the API, but tolerated at runtime
  QRCode.toDataURL('i am a pony!', null, function (err, url) {
    t.ok(!err, 'toDataURL: there should be no error')
    t.match(url, /^data:image\/png;base64,/, 'toDataURL: should return a png data url')
  })

  // @ts-expect-error: null options are not part of the API, but tolerated at runtime
  QRCode.toBuffer('i am a pony!', null, function (err, buffer) {
    t.ok(!err, 'toBuffer: there should be no error')
    t.ok(Buffer.isBuffer(buffer), 'toBuffer: should return a buffer')
  })

  const dir = tempDir(t)
  const file = path.join(dir, 'null-options.png')
  // @ts-expect-error: null options are not part of the API, but tolerated at runtime
  QRCode.toFile(file, 'i am a pony!', null, function (err) {
    t.ok(!err, 'toFile: there should be no error')
    t.ok(fs.statSync(file).size > 0, 'toFile: should write the file')
  })

  // @ts-expect-error: null options are not part of the API, but tolerated at runtime
  QRCode.toString('i am a pony!', null).then(function (str) {
    t.type(str, 'string', 'toString: should resolve (promise)')
  })
})

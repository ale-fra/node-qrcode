const test = require('tap').test
const fs = require('fs')
const os = require('os')
const path = require('path')
const QRCode = require('../../lib')
const Pdf = require('../pdf-parser.cjs')
const Helpers = require('../utils/native-promise.ts')

function modulesOf (buffer) {
  const content = Pdf.parseContent(Pdf.parse(buffer).content)
  return content.groups[content.groups.length - 1].rects
}

test('toFile pdf', function (t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrcode-pdf-'))
  const expected = QRCode.create('i am a pony!')

  t.teardown(function () { fs.rmSync(dir, { recursive: true, force: true }) })

  return Promise.all([
    // type inferred from the file extension (any case)
    QRCode.toFile(path.join(dir, 'a.pdf'), 'i am a pony!'),
    QRCode.toFile(path.join(dir, 'b.PDF'), 'i am a pony!'),
    // explicit type wins over the extension
    QRCode.toFile(path.join(dir, 'c.out'), 'i am a pony!', { type: 'pdf' })
  ]).then(function () {
    ;['a.pdf', 'b.PDF', 'c.out'].forEach(function (name) {
      const buffer = fs.readFileSync(path.join(dir, name))
      t.same(Pdf.modulesFromRects(modulesOf(buffer), expected.modules.size, 4), expected.modules.data,
        name + ' should be a PDF containing the QR code')
    })

    return new Promise(function (resolve) {
      QRCode.toFile(path.join(dir, 'd.pdf'), 'i am a pony!', { rendererOpts: { size: 500 } }, function (err) {
        t.match(err && err.message, /larger than the A4 page/, 'Should report layout errors')
        t.notOk(fs.existsSync(path.join(dir, 'd.pdf')), 'Should not create a file on error')
        resolve()
      })
    })
  })
})

test('toBuffer / toDataURL pdf', function (t) {
  t.plan(5)

  QRCode.toBuffer('i am a pony!', { type: 'pdf' }, function (err, buffer) {
    t.ok(!err, 'toBuffer should not error')
    t.equal(buffer.slice(0, 8).toString(), '%PDF-1.4', 'toBuffer should return a PDF')
  })

  QRCode.toBuffer('i am a pony!', { type: 'application/pdf', rendererOpts: { pageSize: 'Letter' } }).then(function (buffer) {
    t.equal(Pdf.parse(buffer).mediaBox[2], 612, 'Should accept the MIME type and renderer options')
  })

  QRCode.toDataURL('i am a pony!', { type: 'pdf' }).then(function (url) {
    t.ok(url.startsWith('data:application/pdf;base64,'), 'toDataURL should return a PDF data URL')
  })

  QRCode.toDataURL('i am a pony!', { type: 'pdf', rendererOpts: { top: -1 } }).catch(function (err) {
    t.match(err.message, /top must be a non-negative number/, 'Should reject invalid options')
  })
})

test('toPdf', function (t) {
  const texts = ['first', 'second', 'third', 'fourth', 'fifth']
  const opts = { errorCorrectionLevel: 'H', rendererOpts: { size: 40, columns: 2, rows: 2 } }

  function check (buffer, label) {
    const pdf = Pdf.parse(buffer)
    t.equal(pdf.pages.length, 2, label + ': should flow 5 codes over 2 pages of 4')
    const drawn = []
    pdf.pages.forEach(function (page) {
      const groups = Pdf.parseContent(page.content).groups
      for (let i = 1; i < groups.length; i += 2) drawn.push(groups[i].rects)
    })
    t.same(drawn.map(function (rects, i) {
      const expected = QRCode.create(texts[i], opts).modules
      return Pdf.modulesFromRects(rects, expected.size, 4).join('') === expected.data.join('')
    }), [true, true, true, true, true], label + ': codes should be in input order with the QR options applied')
  }

  t.throws(function () { QRCode.toPdf() }, /non-empty array/, 'Should throw without texts')
  t.throws(function () { QRCode.toPdf([]) }, /non-empty array/, 'Should throw with an empty list')
  t.throws(function () { QRCode.toPdf('text') }, /non-empty array/, 'Should throw with a string')

  return Promise.all([
    QRCode.toPdf(texts, opts).then(function (buffer) { check(buffer, 'promise') }),
    new Promise(function (resolve) {
      QRCode.toPdf(texts, opts, function (err, buffer) {
        t.error(err, 'callback: no error')
        check(buffer, 'callback')
        resolve()
      })
    }),
    QRCode.toPdf(['ok', 'x'.repeat(5000)]).then(function () {
      t.fail('Should reject data that does not fit')
    }, function (err) {
      t.match(err.message, /^Item 2: The amount of data is too big/, 'Should name the failing item')
    }),
    new Promise(function (resolve) {
      QRCode.toPdf(['ok'], { rendererOpts: { columns: 0 } }, function (err, buffer) {
        t.match(err && err.message, /columns must be a positive integer/, 'Should pass layout errors to the callback')
        t.notOk(buffer, 'Should not return a buffer on error')
        resolve()
      })
    })
  ])
})

test('toPdf - no promise available', function (t) {
  Helpers.removeNativePromise()
  t.throws(function () { QRCode.toPdf(['a']) }, /Callback required/, 'Should require a callback without Promise')
  Helpers.restoreNativePromise()
  t.end()
})

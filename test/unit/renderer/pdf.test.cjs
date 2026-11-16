const test = require('tap').test
const sinon = require('sinon')
const fs = require('fs')
const QRCode = require('../../../lib/core/qrcode')
const PdfRenderer = require('../../../lib/renderer/pdf')
const Pdf = require('../../pdf-parser.cjs')

const MM = Pdf.PT_PER_MM

function close (t, found, wanted, msg, tolerance) {
  t.ok(Math.abs(found - wanted) < (tolerance || 0.001), msg + ' (found ' + found + ', wanted ' + wanted + ')')
}

test('PDF renderer interface', function (t) {
  t.type(PdfRenderer.render, 'function', 'Should have render function')
  t.type(PdfRenderer.renderToBuffer, 'function', 'Should have renderToBuffer function')
  t.type(PdfRenderer.renderToDataURL, 'function', 'Should have renderToDataURL function')
  t.type(PdfRenderer.renderToFile, 'function', 'Should have renderToFile function')
  t.end()
})

test('PDF render - document structure', function (t) {
  const qrData = QRCode.create('sample text', { version: 2 })
  const pdf = Pdf.parse(PdfRenderer.render(qrData))

  t.equal(pdf.version, '1.4', 'Should be a PDF 1.4 document')
  t.equal(Object.keys(pdf.objects).length, 5, 'Should contain 5 objects')
  t.match(pdf.trailer, /\/Info 5 0 R/, 'Should reference an info dictionary')
  t.match(pdf.objects[5].body, /\/Producer \(node-qrcode\)/, 'Should set the producer')
  t.notMatch(pdf.objects[5].body, /CreationDate/, 'Should not embed a date (reproducible output)')
  t.same(pdf.extGStates, {}, 'Should not use transparency for opaque colors')
  t.ok(PdfRenderer.render(qrData).equals(PdfRenderer.render(qrData)), 'Should be deterministic')
  t.end()
})

test('PDF render - geometry matches the QR code', function (t) {
  ;[
    ['sample text', { version: 2 }, {}],
    ['numeric 0123456789', { errorCorrectionLevel: 'H' }, { margin: 0 }],
    ['A'.repeat(500), { errorCorrectionLevel: 'L' }, { margin: 1, rendererOpts: { size: 150 } }]
  ].forEach(function (sample) {
    const qrData = QRCode.create(sample[0], sample[1])
    const opts = sample[2]
    const margin = typeof opts.margin === 'undefined' ? 4 : opts.margin
    const content = Pdf.parseContent(Pdf.parse(PdfRenderer.render(qrData, opts)).content)
    const dark = content.groups[content.groups.length - 1]
    const size = qrData.modules.size

    t.same(Pdf.modulesFromRects(dark.rects, size, margin), qrData.modules.data,
      'Dark rectangles should reproduce the module matrix (version ' + qrData.version + ', margin ' + margin + ')')
    t.ok(dark.filled, 'Dark modules should be filled')
  })
  t.end()
})

test('PDF render - default layout is a centered 50 mm code on A4', function (t) {
  const qrData = QRCode.create('sample text', { version: 2 })
  const pdf = Pdf.parse(PdfRenderer.render(qrData))
  const m = Pdf.parseContent(pdf.content).matrix
  const modules = qrData.modules.size + 8

  t.same(pdf.mediaBox.slice(0, 2), [0, 0], 'MediaBox should start at the origin')
  close(t, pdf.mediaBox[2], 210 * MM, 'Page width should be A4')
  close(t, pdf.mediaBox[3], 297 * MM, 'Page height should be A4')
  close(t, m[0] * modules, 50 * MM, 'Code should be 50 mm wide')
  close(t, m[3] * modules, -50 * MM, 'Code should be 50 mm high, drawn top-down')
  t.equal(m[1], 0, 'No rotation/skew')
  t.equal(m[2], 0, 'No rotation/skew')
  close(t, m[4], 80 * MM, 'Code should be horizontally centered')
  close(t, m[5], (297 - 123.5) * MM, 'Code should be vertically centered')
  t.end()
})

test('PDF render - page sizes and placement', function (t) {
  const qrData = QRCode.create('sample text')
  const sizes = { A3: [297, 420], A4: [210, 297], A5: [148, 210], Letter: [215.9, 279.4], legal: [215.9, 355.6] }

  Object.keys(sizes).forEach(function (name) {
    const pdf = Pdf.parse(PdfRenderer.render(qrData, { rendererOpts: { pageSize: name } }))
    close(t, pdf.mediaBox[2], sizes[name][0] * MM, name + ' width')
    close(t, pdf.mediaBox[3], sizes[name][1] * MM, name + ' height')
  })

  const placed = Pdf.parseContent(Pdf.parse(PdfRenderer.render(qrData, {
    rendererOpts: { size: 30, top: 12, left: 7 }
  })).content).matrix
  const modules = qrData.modules.size + 8
  close(t, placed[0] * modules, 30 * MM, 'Should use the requested size')
  close(t, placed[4], 7 * MM, 'Should place the left edge')
  close(t, placed[5], (297 - 12) * MM, 'Should place the top edge')

  const edge = PdfRenderer.getLayout({ size: 30, top: 267, left: 180 })
  t.same([edge.top, edge.left], [267, 180], 'Should allow touching the page edges')

  const topOnly = PdfRenderer.getLayout({ top: 5 })
  t.same([topOnly.top, topOnly.left], [5, 80], 'Should center the unspecified axis')

  const defaults = PdfRenderer.getLayout()
  t.same([defaults.page.name, defaults.size], ['A4', 50], 'Should default to a 50 mm code on A4')
  t.end()
})

test('PDF render - colors', function (t) {
  const qrData = QRCode.create('sample text')

  const opaque = Pdf.parseContent(Pdf.parse(PdfRenderer.render(qrData, {
    color: { dark: '#336699', light: '#ffcc00' }
  })).content)
  t.equal(opaque.groups.length, 2, 'Should paint background and modules')
  t.same(opaque.groups[0].rgb, [1, 0.8, 0], 'Should paint the light color background')
  t.same(opaque.groups[0].rects, [[0, 0, qrData.modules.size + 8, qrData.modules.size + 8]],
    'Background should cover the code and its quiet zone')
  t.same(opaque.groups[1].rgb, [0.2, 0.4, 0.6], 'Should paint modules with the dark color')

  const alpha = Pdf.parse(PdfRenderer.render(qrData, { color: { dark: '#00000080', light: '#ffffff40' } }))
  const alphaContent = Pdf.parseContent(alpha.content)
  t.same(alpha.extGStates, { GSLight: 0.251, GSDark: 0.502 }, 'Should define fill alpha for translucent colors')
  t.equal(alphaContent.groups[0].gs, 'GSLight', 'Should apply the light alpha to the background')
  t.equal(alphaContent.groups[1].gs, 'GSDark', 'Should apply the dark alpha to the modules')

  const transparent = Pdf.parseContent(Pdf.parse(PdfRenderer.render(qrData, { color: { light: '#0000' } })).content)
  t.equal(transparent.groups.length, 1, 'Should not paint a fully transparent background')
  t.end()
})

test('PDF render - invalid layouts', function (t) {
  const qrData = QRCode.create('sample text')
  const render = function (rendererOpts) {
    return function () { PdfRenderer.render(qrData, { rendererOpts }) }
  }

  t.throws(render({ pageSize: 'B5' }), /Unsupported page size: B5/, 'Should reject unknown page sizes')
  ;[0, -1, NaN, Infinity, '40'].forEach(function (size) {
    t.throws(render({ size }), /size must be a positive number/, 'Should reject size ' + size)
  })
  ;['top', 'left'].forEach(function (key) {
    ;[-1, NaN, '5'].forEach(function (value) {
      const opts = {}
      opts[key] = value
      t.throws(render(opts), new RegExp(key + ' must be a non-negative number'), 'Should reject ' + key + ' ' + value)
    })
  })
  t.throws(render({ size: 250 }), /size \(250 mm\) is larger than the A4 page/, 'Should reject codes larger than the page')
  t.throws(render({ size: 200, pageSize: 'A5' }), /larger than the A5 page \(148 x 210 mm\)/, 'Should name the page size')
  t.throws(render({ left: 170 }), /does not fit on the A4 page/, 'Should reject codes off the right edge')
  t.throws(render({ top: 260 }), /at left 80 mm, top 260 mm\) does not fit/, 'Should reject codes off the bottom edge')
  t.end()
})

test('PDF renderToBuffer', function (t) {
  const qrData = QRCode.create('sample text')
  t.plan(5)

  PdfRenderer.renderToBuffer(qrData, function (err, buffer) {
    t.ok(!err, 'Should not generate errors with only qrData param')
    t.ok(Buffer.isBuffer(buffer), 'Should return a Buffer')
    t.doesNotThrow(function () { Pdf.parse(buffer) }, 'Should return a valid PDF')
  })

  PdfRenderer.renderToBuffer(qrData, { rendererOpts: { size: 999 } }, function (err, buffer) {
    t.ok(err, 'Should pass layout errors to the callback')
    t.notOk(buffer, 'Should not return a buffer on error')
  })
})

test('PDF renderToDataURL', function (t) {
  const qrData = QRCode.create('sample text')
  t.plan(4)

  PdfRenderer.renderToDataURL(qrData, function (err, url) {
    t.ok(!err, 'Should not generate errors with only qrData param')
    t.equal(url.split(',')[0], 'data:application/pdf;base64', 'Should have correct header')
    t.doesNotThrow(function () { Pdf.parse(Buffer.from(url.split(',')[1], 'base64')) }, 'Should encode a valid PDF')
  })

  PdfRenderer.renderToDataURL(qrData, { rendererOpts: { pageSize: 'nope' } }, function (err) {
    t.ok(err, 'Should pass errors to the callback')
  })
})

test('PDF renderToFile', function (t) {
  const qrData = QRCode.create('sample text')
  const fileName = 'qrimage.pdf'
  let fsStub = sinon.stub(fs, 'writeFile').callsArgWith(2, null)

  t.plan(7)

  PdfRenderer.renderToFile(fileName, qrData, function (err) {
    t.ok(!err, 'Should not generate errors with only qrData param')
    t.equal(fsStub.getCall(0).args[0], fileName, 'Should save file with correct file name')
    t.doesNotThrow(function () { Pdf.parse(fsStub.getCall(0).args[1]) }, 'Should write a valid PDF')
  })

  PdfRenderer.renderToFile(fileName, qrData, { margin: 2 }, function (err) {
    t.ok(!err, 'Should not generate errors with options param')
  })

  PdfRenderer.renderToFile(fileName, qrData, { rendererOpts: { size: -1 } }, function (err) {
    t.ok(err, 'Should pass layout errors to the callback')
    t.equal(fsStub.callCount, 2, 'Should not write a file on layout errors')
  })

  fsStub.restore()
  fsStub = sinon.stub(fs, 'writeFile').callsArgWith(2, new Error('Write error'))

  PdfRenderer.renderToFile(fileName, qrData, function (err) {
    t.ok(err, 'Should fail if error occurs during save')
  })

  fsStub.restore()
})

test('PDF test parser rejects corrupted documents', function (t) {
  const good = PdfRenderer.render(QRCode.create('sample text'))
  const text = good.toString('latin1')
  const corrupt = function (from, to) { return Buffer.from(text.replace(from, to), 'latin1') }
  const xrefOffset = text.slice(text.lastIndexOf('startxref\n') + 10).split('\n')[0]
  const firstEntry = text.match(/\n(\d{10}) 00000 n /)[1]
  const length = text.match(/\/Length (\d+)/)[1]

  t.doesNotThrow(function () { Pdf.parse(good) }, 'Should accept a valid document')
  t.throws(function () { Pdf.parse(corrupt('%PDF-1.4', '%PDX-1.4')) }, /header/, 'Should detect a bad header')
  t.throws(function () { Pdf.parse(corrupt('%%EOF\n', '')) }, /startxref/, 'Should detect a missing EOF')
  t.throws(function () { Pdf.parse(corrupt('startxref\n' + xrefOffset, 'startxref\n' + (+xrefOffset - 1))) }, /point to xref/, 'Should detect a wrong startxref')
  t.throws(function () { Pdf.parse(corrupt('\ntrailer\n', '\ntrailr\n')) }, /malformed xref/, 'Should detect a malformed trailer')
  t.throws(function () { Pdf.parse(corrupt('xref\n0 6\n', 'xref\n0 7\n')) }, /expected 7/, 'Should detect a wrong xref count')
  t.throws(function () { Pdf.parse(corrupt('0000000000 65535 f ', '0000000000 65535 n ')) }, /free entry/, 'Should detect a bad free entry')
  t.throws(function () { Pdf.parse(corrupt(firstEntry + ' 00000 n ', firstEntry + ' 0000 n  ')) }, /bad xref entry/, 'Should detect a malformed entry')
  t.throws(function () { Pdf.parse(corrupt(firstEntry + ' 00000 n ', String(+firstEntry + 1).padStart(10, '0') + ' 00000 n ')) }, /offset of object 1/, 'Should detect a wrong object offset')
  t.throws(function () { Pdf.parse(corrupt('/Size 6 ', '/Size 5 ')) }, /Size mismatch/, 'Should detect a wrong trailer size')
  t.throws(function () { Pdf.parse(corrupt('/Type /Catalog', '/Type /Katalog')) }, /no catalog/, 'Should detect a missing catalog')
  t.throws(function () { Pdf.parse(corrupt('/Type /Page ', '/Type /Pag  ')) }, /object 3 is not a page/, 'Should detect a missing page')
  t.throws(function () { Pdf.parse(corrupt('/Type /Pages', '/Type /Pagez')) }, /no page tree/, 'Should detect a missing page tree')
  t.throws(function () { Pdf.parse(corrupt('/Kids [3 0 R]', '/Kids [     ]')) }, /no pages/, 'Should detect an empty page tree')
  t.throws(function () { Pdf.parse(corrupt('/Count 1 ', '/Count 2 ')) }, /Count mismatch/, 'Should detect a wrong page count')
  t.throws(function () { Pdf.parse(corrupt('/Parent 2 0 R', '/Parent 9 0 R')) }, /wrong parent/, 'Should detect a wrong parent')
  // same number of digits, so no other offset shifts
  const badLength = String(+length + 1).length === length.length ? +length + 1 : +length - 1
  t.throws(function () { Pdf.parse(corrupt('/Length ' + length + ' ', '/Length ' + badLength + ' ')) }, /stream \/Length/, 'Should detect a wrong stream length')

  t.throws(function () { Pdf.parseContent('q\n1 0 0 1 0 0 cm\nBT\nQ') }, /Unexpected operator: BT/, 'Should reject unknown operators')
  t.throws(function () { Pdf.parseContent('q\nq\nQ') }, /Unbalanced/, 'Should reject unbalanced groups')
  t.throws(function () { Pdf.modulesFromRects([[0, 0, 1, 2]], 3, 0) }, /one module/, 'Should reject tall rects')
  t.throws(function () { Pdf.modulesFromRects([[0, 0, 2, 1], [1, 0, 1, 1]], 3, 0) }, /overlapping/, 'Should reject overlapping rects')
  t.same(Pdf.parse(corrupt('/Filter /FlateDecode ', '/Filter /None'.padEnd(21))).content.length > 0, true,
    'Should read uncompressed streams as-is')
  t.end()
})

test('PDF grid layout', function (t) {
  const grid = PdfRenderer.getGridLayout()
  t.same([grid.page.name, grid.size, grid.gap, grid.columns, grid.rows], ['A4', 50, 5, 3, 5],
    'Should fit 3 x 5 codes of 50 mm with 5 mm gaps on A4 by default')
  t.same(grid.cells[0], { left: 25, top: 13.5 }, 'Should center the grid on the page')
  t.same(grid.cells[1], { left: 80, top: 13.5 }, 'Should step by size + gap horizontally')
  t.same(grid.cells[3], { left: 25, top: 68.5 }, 'Should fill row by row')
  t.equal(grid.cells.length, 15, 'Should have one cell per code per page')

  const placed = PdfRenderer.getGridLayout({ size: 25, gap: 4, top: 12, left: 8 })
  t.same([placed.columns, placed.rows], [6, 9], 'Should fit from top/left up to the 10 mm border')
  t.same(placed.cells[0], { left: 8, top: 12 }, 'Should start the grid at top/left')

  const fixed = PdfRenderer.getGridLayout({ size: 20, gap: 0, columns: 4, rows: 6, pageSize: 'Letter' })
  t.same([fixed.columns, fixed.rows], [4, 6], 'Should use explicit columns and rows')
  t.ok(Math.abs(fixed.cells[0].left - (215.9 - 80) / 2) < 1e-9, 'Should center an explicit grid')
  t.same(fixed.cells[1].left - fixed.cells[0].left, 20, 'Gap 0 should place codes edge to edge')

  // 15 x 16.6 + 14 x 2 = 277 mm = A4 height minus two 10 mm borders, but
  // (277 + 2) / (16.6 + 2) = 14.999999999999998 in floating point
  const tight = PdfRenderer.getGridLayout({ size: 16.6, gap: 2 })
  t.equal(tight.rows, 15, 'Should tolerate floating point rounding when codes fill the page exactly')

  const single = PdfRenderer.getGridLayout({ size: 180 })
  t.same([single.columns, single.rows], [1, 1], 'Should fit a single large code')
  t.end()
})

test('PDF grid layout - invalid', function (t) {
  const grid = function (opts) { return function () { PdfRenderer.getGridLayout(opts) } }

  ;['columns', 'rows'].forEach(function (key) {
    ;[0, -1, 2.5, NaN, '3'].forEach(function (value) {
      const opts = {}
      opts[key] = value
      t.throws(grid(opts), new RegExp(key + ' must be a positive integer'), 'Should reject ' + key + ' ' + value)
    })
  })
  t.throws(grid({ gap: -1 }), /gap must be a non-negative number/, 'Should reject a negative gap')
  t.throws(grid({ size: 195 }), /No room for a 195 mm QR code on the A4 page .* within 10 mm of the edges/,
    'Should explain when auto-fit finds no room')
  t.throws(grid({ columns: 5 }), /5 columns of 50 mm codes with 5 mm gaps need 270 mm, but the A4 page is 210 mm wide/,
    'Should reject too many columns')
  t.throws(grid({ rows: 6 }), /6 rows of 50 mm codes with 5 mm gaps need 325 mm, but the A4 page is 297 mm high/,
    'Should reject too many rows')
  t.throws(grid({ columns: 3, left: 100 }), /Grid of 3 x 5 codes \(160 x 270 mm\) at left 100 mm, top 13.5 mm does not fit/,
    'Should reject a grid pushed off the page')
  t.end()
})

test('PDF renderMany', function (t) {
  const texts = []
  for (let i = 1; i <= 17; i++) texts.push('item ' + i)
  const qrDataList = texts.map(function (text) { return QRCode.create(text) })
  const pdf = Pdf.parse(PdfRenderer.renderMany(qrDataList, { rendererOpts: { size: 40, gap: 10, columns: 2, rows: 4 } }))
  const grid = PdfRenderer.getGridLayout({ size: 40, gap: 10, columns: 2, rows: 4 })

  t.equal(pdf.pages.length, 3, 'Should flow 17 codes over 3 pages of 8')
  t.same(pdf.pages.map(function (p) { return p.mediaBox }), [pdf.mediaBox, pdf.mediaBox, pdf.mediaBox],
    'All pages should have the same size')

  const drawn = []
  pdf.pages.forEach(function (page) {
    const groups = Pdf.parseContent(page.content).groups
    // each code: a light background group followed by a dark module group
    for (let i = 0; i < groups.length; i += 2) drawn.push(groups[i + 1])
  })
  t.equal(drawn.length, 17, 'Should draw every code exactly once')

  // content order matches the cell order: rebuild each code and check its placement
  let index = 0
  pdf.pages.forEach(function (page, p) {
    // one transformation matrix per code, whatever its values
    const matrices = page.content.match(/^(\S+ ){6}cm$/gm) || []
    t.equal(matrices.length, [8, 8, 1][p], 'Page ' + (p + 1) + ' should place ' + [8, 8, 1][p] + ' codes')
    matrices.forEach(function (line, i) {
      const m = line.split(' ').map(Number)
      const cell = grid.cells[i]
      const modules = qrDataList[index].modules
      const total = modules.size + 8 // quiet zone of 4 modules on each side
      // the scale is written with 4 decimals: up to 0.00005 pt error per module
      const sizeTolerance = 2 * 0.00005 * total
      close(t, m[0] * total, 40 * MM, 'Code ' + (index + 1) + ' width', sizeTolerance)
      close(t, m[3] * total, -40 * MM, 'Code ' + (index + 1) + ' height, drawn top-down', sizeTolerance)
      t.same([m[1], m[2]], [0, 0], 'Code ' + (index + 1) + ' should not be rotated or skewed')
      close(t, m[4], cell.left * MM, 'Code ' + (index + 1) + ' left')
      close(t, m[5], (297 - cell.top) * MM, 'Code ' + (index + 1) + ' top')
      t.same(Pdf.modulesFromRects(drawn[index].rects, modules.size, 4), modules.data,
        'Code ' + (index + 1) + ' should be ' + texts[index])
      index++
    })
  })
  t.equal(index, 17, 'Should have checked every code')

  const alpha = Pdf.parse(PdfRenderer.renderMany(qrDataList.slice(0, 9), {
    color: { dark: '#00000080' },
    rendererOpts: { columns: 2, rows: 2 }
  }))
  t.equal(alpha.pages.length, 3, 'Should add pages for the remainder')
  alpha.pages.forEach(function (page, i) {
    t.same(page.extGStates, { GSDark: 0.502 }, 'Page ' + (i + 1) + ' should reference the transparency state')
  })

  t.throws(function () { PdfRenderer.renderMany(qrDataList, { rendererOpts: { columns: 9 } }) },
    /9 columns/, 'Should validate the grid')
  t.end()
})

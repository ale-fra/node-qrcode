const test = require('tap').test
const fs = require('fs')
const os = require('os')
const path = require('path')
const spawnSync = require('child_process').spawnSync
const QRCode = require('../../lib')
const Pdf = require('../pdf-parser.cjs')

const BIN = path.join(__dirname, '..', '..', 'bin', 'qrcode.js')

// Child processes inherit instrumentation: the TypeScript CLI is covered too.
const CHILD_ENV = Object.assign({}, process.env)

function run (args, input) {
  const res = spawnSync(process.execPath, [BIN].concat(args), { input: input || '', encoding: 'utf8', env: CHILD_ENV })
  return { code: res.status, stdout: res.stdout, stderr: res.stderr }
}

function tmpDir (t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrcode-cli-'))
  t.teardown(function () { fs.rmSync(dir, { recursive: true, force: true }) })
  return dir
}

function darkModules (file) {
  const content = Pdf.parseContent(Pdf.parse(fs.readFileSync(file)).content)
  return content.groups[content.groups.length - 1].rects
}

test('CLI pdf output', function (t) {
  const dir = tmpDir(t)
  const out = path.join(dir, 'out.pdf')
  const expected = QRCode.create('hello pdf')

  const res = run(['-o', out, 'hello pdf'])
  t.equal(res.code, 0, 'Should exit successfully')
  t.match(res.stdout, 'saved qrcode to: ' + out, 'Should report the saved file')
  t.equal(res.stderr, '', 'Should not print warnings')
  t.same(Pdf.modulesFromRects(darkModules(out), expected.modules.size, 4), expected.modules.data,
    'Should infer PDF from the extension and contain the QR code')

  const typed = path.join(dir, 'typed.out')
  t.equal(run(['-t', 'pdf', '-o', typed, 'hello pdf']).code, 0, 'Should accept -t pdf')
  t.equal(fs.readFileSync(typed).slice(0, 5).toString(), '%PDF-', 'Should write a PDF with -t pdf')

  const piped = path.join(dir, 'stdin.pdf')
  t.equal(run(['-o', piped], 'hello pdf').code, 0, 'Should read text from stdin')
  t.same(darkModules(piped), darkModules(out), 'stdin and argument input should produce the same code')
  t.end()
})

test('CLI pdf layout options', function (t) {
  const dir = tmpDir(t)
  const out = path.join(dir, 'placed.pdf')

  const res = run(['-o', out, '--page-size', 'letter', '--size', '40', '--top', '10', '--left', '15', '-q', '2', 'placed'])
  t.equal(res.code, 0, 'Should exit successfully')

  const pdf = Pdf.parse(fs.readFileSync(out))
  const m = Pdf.parseContent(pdf.content).matrix
  const modules = QRCode.create('placed').modules.size + 4
  t.same(pdf.mediaBox, [0, 0, 612, 792], 'Should use the (case-insensitive) page size')
  t.ok(Math.abs(m[0] * modules - 40 * Pdf.PT_PER_MM) < 0.001, 'Should use --size (mm) with the --qzone margin')
  t.ok(Math.abs(m[4] - 15 * Pdf.PT_PER_MM) < 0.001, 'Should use --left (mm)')
  t.ok(Math.abs(m[5] - (279.4 - 10) * Pdf.PT_PER_MM) < 0.001, 'Should use --top (mm)')
  t.end()
})

test('CLI pdf errors and warnings', function (t) {
  const dir = tmpDir(t)

  const tooBig = run(['-o', path.join(dir, 'big.pdf'), '--size', '300', 'x'])
  t.equal(tooBig.code, 1, 'Should fail when the code does not fit')
  t.match(tooBig.stderr, 'Error: QR code size (300 mm) is larger than the A4 page', 'Should explain why')
  t.notOk(fs.existsSync(path.join(dir, 'big.pdf')), 'Should not write a file')

  const badSize = run(['-o', path.join(dir, 'nan.pdf'), '--size', 'abc', 'x'])
  t.equal(badSize.code, 1, 'Should fail on a non-numeric size')
  t.match(badSize.stderr, 'size must be a positive number', 'Should explain why')

  const badPage = run(['-o', path.join(dir, 'b5.pdf'), '--page-size', 'B5', 'x'])
  t.equal(badPage.code, 1, 'Should reject unknown page sizes')
  t.match(badPage.stderr, 'Invalid values', 'Should list the valid choices')

  const png = path.join(dir, 'out.png')
  const ignored = run(['-o', png, '--size', '40', '--top', '5', 'x'])
  t.equal(ignored.code, 0, 'Should still write non-PDF output')
  t.match(ignored.stderr, 'Warning: --size, --top only used for PDF output, ignoring', 'Should warn about ignored PDF options')
  t.equal(fs.readFileSync(png).slice(1, 4).toString(), 'PNG', 'Should write a PNG')
  t.end()
})

test('CLI help lists pdf options', function (t) {
  const res = run(['--help'])
  t.equal(res.code, 0, 'Should exit successfully')
  t.match(res.stdout, /"pdf"/, 'Should list pdf as an output type')
  t.match(res.stdout, 'PDF options (sizes in mm):', 'Should have a PDF options group')
  ;['--page-size', '--size', '--top', '--left'].forEach(function (flag) {
    t.match(res.stdout, flag, 'Should document ' + flag)
  })
  t.end()
})

function codesOf (file) {
  const drawn = []
  Pdf.parse(fs.readFileSync(file)).pages.forEach(function (page) {
    const groups = Pdf.parseContent(page.content).groups
    for (let i = 1; i < groups.length; i += 2) drawn.push(groups[i].rects)
  })
  return drawn
}

function expectCodes (t, file, texts, label) {
  const drawn = codesOf(file)
  t.equal(drawn.length, texts.length, label + ': should contain ' + texts.length + ' codes')
  t.same(drawn.map(function (rects, i) {
    const expected = QRCode.create(texts[i]).modules
    return Pdf.modulesFromRects(rects, expected.size, 4).join('') === expected.data.join('')
  }), texts.map(function () { return true }), label + ': codes should match the inputs, in order')
}

test('CLI batch', function (t) {
  const dir = tmpDir(t)
  const lines = []
  for (let i = 1; i <= 20; i++) lines.push('https://example.com/p/' + i)

  const fromStdin = path.join(dir, 'stdin.pdf')
  const res = run(['-o', fromStdin, '--batch', '--size', '40', '--columns', '3', '--rows', '3'], lines.join('\n') + '\n')
  t.equal(res.code, 0, 'Should exit successfully')
  t.match(res.stdout, 'saved 20 qrcodes on 3 pages to: ' + fromStdin, 'Should report codes and pages')
  t.equal(res.stderr, '', 'Should not print warnings')
  t.equal(Pdf.parse(fs.readFileSync(fromStdin)).pages.length, 3, 'Should create 3 pages of 9')
  expectCodes(t, fromStdin, lines, 'stdin')

  const messy = path.join(dir, 'messy.pdf')
  t.equal(run(['-o', messy, '--batch'], '\n   \nalpha\r\nbeta\n\n  spaced  \n').code, 0, 'Should accept messy input')
  expectCodes(t, messy, ['alpha', 'beta', '  spaced  '], 'blank lines skipped, CRLF handled, spaces kept')

  const fromArgs = path.join(dir, 'args.pdf')
  const single = run(['-o', fromArgs, '--batch', 'one two'])
  t.match(single.stdout, 'saved 1 qrcode on 1 page', 'Should use singular wording')
  t.equal(run(['-o', fromArgs, '--batch', 'one', 'two', 'three']).code, 0, 'Should accept arguments')
  expectCodes(t, fromArgs, ['one', 'two', 'three'], 'one code per argument')

  const noBatch = path.join(dir, 'nobatch.pdf')
  t.equal(run(['-o', noBatch], 'line 1\nline 2').code, 0, 'Without --batch, stdin is one text')
  expectCodes(t, noBatch, ['line 1\nline 2'], 'multi-line stdin without --batch')
  t.end()
})

test('CLI batch errors and warnings', function (t) {
  const dir = tmpDir(t)

  ;[
    [['-o', path.join(dir, 'x.png'), '--batch', 'a', 'b'], '--batch requires PDF output', 'non-PDF output'],
    [['--batch', 'a', 'b'], '--batch requires PDF output', 'missing -o'],
    [['-o', path.join(dir, 'x.pdf'), '--batch', '--columns', '5', 'a'], '5 columns of 50 mm codes', 'grid too wide'],
    [['-o', path.join(dir, 'x.pdf'), '--batch', '--columns', '2.5', 'a'], 'PDF columns must be a positive integer', 'bad columns'],
    [['-o', path.join(dir, 'x.pdf'), '--batch', 'ok', 'x'.repeat(3000)], 'Item 2: The amount of data is too big', 'item too long']
  ].forEach(function (c) {
    const res = run(c[0])
    t.equal(res.code, 1, c[2] + ': should fail')
    t.match(res.stderr, 'Error: ' + c[1], c[2] + ': should explain why')
  })
  t.notOk(fs.existsSync(path.join(dir, 'x.pdf')), 'Should not write a file on error')

  const empty = run(['-o', path.join(dir, 'empty.pdf'), '--batch'], '\n\n')
  t.equal(empty.code, 1, 'Should fail without any non-blank input')
  t.match(empty.stderr, 'Usage:', 'Should show the help')

  const ignored = run(['-o', path.join(dir, 'one.pdf'), '--columns', '3', '--gap', '2', 'single'])
  t.equal(ignored.code, 0, 'Grid options without --batch should not fail')
  t.match(ignored.stderr, 'Warning: --gap, --columns only used with --batch, ignoring', 'Should warn about them')
  t.end()
})

test('CLI batch write error', function (t) {
  const dir = tmpDir(t)
  const out = path.join(dir, 'missing-parent', 'out.pdf')
  const res = run(['-o', out, '--batch', 'hello'])
  t.equal(res.code, 1, 'Should fail when the destination cannot be written')
  t.match(res.stderr, 'ENOENT', 'Should explain the filesystem error')
  t.notOk(fs.existsSync(out), 'Should leave no partial file')
  t.end()
})

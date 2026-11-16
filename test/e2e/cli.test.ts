import { test } from 'tap'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { PNG } from 'pngjs'
import * as QRCode from '../../lib'
import { CLI_PATH, ROOT_DIR } from '../utils/paths'
import { tempDir } from '../utils/tmp'

/**
 * Runs the compiled command line interface (stdin is not a terminal)
 */
function cli (args: string[], input = ''): { status: number | null, stdout: string, stderr: string } {
  const result = spawnSync(process.execPath, [CLI_PATH].concat(args), { input, encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

function terminalOutput (text: string, small?: boolean): string {
  return QRCode.toString(text, { type: 'terminal', small }, function () {}) + '\n'
}

test('CLI - print text from arguments', function (t) {
  const result = cli(['some', 'text'])

  t.equal(result.status, 0, 'Should exit without errors')
  t.equal(result.stdout, terminalOutput('some text'), 'Should print the QR code')
  t.end()
})

test('CLI - print text from stdin', function (t) {
  const result = cli(['--small'], 'from stdin')

  t.equal(result.status, 0, 'Should exit without errors')
  t.equal(result.stdout, terminalOutput('from stdin', true), 'Should print the QR code of the input')
  t.end()
})

test('CLI - save to file', function (t) {
  const dir = tempDir(t)
  const png = path.join(dir, 'out.png')
  const svg = path.join(dir, 'out.svg')

  let result = cli(['-o', png, '-w', '300', 'some text'])
  t.equal(result.status, 0, 'Should exit without errors')
  t.equal(result.stdout, 'saved qrcode to: ' + png + '\n\n', 'Should print the file name')
  t.equal(PNG.sync.read(fs.readFileSync(png)).width, 300, 'Should save a png file with the specified width')

  result = cli(['-t', 'svg', '-o', svg, 'some text'])
  t.equal(result.status, 0, 'Should exit without errors')
  t.ok(fs.readFileSync(svg, 'utf8').includes('<svg'), 'Should save a svg file')
  t.end()
})

test('CLI - errors', function (t) {
  const longText = new Array(200).join('i am a pony!')

  let result = cli(['-v', '1', longText])
  t.equal(result.status, 1, 'Should exit with an error if the text cannot be encoded')
  t.match(result.stderr, /^Error: /, 'Should print the error')

  result = cli(['-v', '1', '-o', path.join(tempDir(t), 'out.png'), longText])
  t.equal(result.status, 1, 'Should exit with an error if the file cannot be saved')
  t.match(result.stderr, /^Error: /, 'Should print the error')

  result = cli(['-e', 'X', 'text'])
  t.equal(result.status, 1, 'Should exit with an error if an option is invalid')
  t.match(result.stderr, /Invalid values/, 'Should print the validation error')

  result = cli([])
  t.equal(result.status, 1, 'Should exit with an error if there is no text')
  t.match(result.stderr, /^Usage: qrcode \[options\] <input string>/, 'Should print the help')
  t.end()
})

test('CLI - version', function (t) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'))
  const result = cli(['--version'])

  t.equal(result.stdout.trim(), pkg.version, 'Should print the package version')
  t.end()
})

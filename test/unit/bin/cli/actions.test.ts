import { test } from 'tap'
import * as fs from 'fs'
import * as path from 'path'
import * as QRCode from '../../../../lib'
import { getOptions } from '../../../../bin/cli/options'
import { run } from '../../../../bin/cli/actions'
import type { CliIO } from '../../../../bin/cli/actions'
import { tempDir } from '../../../utils/tmp'

interface IORecorder extends CliIO {
  logs: string[]
  errors: unknown[][]
  exitCodes: number[]
  helpShown: number
}

/**
 * Records the process interactions
 */
function recordIO (onExit?: () => void): IORecorder {
  const io: IORecorder = {
    logs: [],
    errors: [],
    exitCodes: [],
    helpShown: 0,
    log: (message) => { io.logs.push(message) },
    error: (...args) => { io.errors.push(args) },
    exit: (code) => {
      io.exitCodes.push(code)
      if (onExit) onExit()
    },
    showHelp: () => { io.helpShown++ }
  }
  return io
}

const LONG_TEXT = new Array(200).join('i am a pony!')

test('CLI run - no text', function (t) {
  const io = recordIO()

  run('', undefined, getOptions({ _: [] }), io)

  t.equal(io.helpShown, 1, 'Should show the help')
  t.same(io.exitCodes, [1], 'Should exit with an error')
  t.same(io.logs, [], 'Should not output anything')
  t.end()
})

test('CLI run - print', function (t) {
  const io = recordIO()

  run('some text', undefined, getOptions({ _: [], small: true }), io)

  t.same(io.logs, [QRCode.toString('some text', { type: 'terminal', small: true }, function () {})],
    'Should print the QR code to the terminal')
  t.same(io.exitCodes, [], 'Should not exit')
  t.end()
})

test('CLI run - print error', function (t) {
  const io = recordIO()

  run(LONG_TEXT, undefined, getOptions({ _: [], qversion: 1 }), io)

  t.equal(io.errors.length, 1, 'Should report an error')
  t.equal(io.errors[0][0], 'Error:', 'Should prefix the error message')
  t.same(io.exitCodes, [1], 'Should exit with an error')
  t.same(io.logs, [], 'Should not print anything')
  t.end()
})

test('CLI run - save', function (t) {
  const file = path.join(tempDir(t), 'out.svg')
  const io = recordIO()

  // file is saved asynchronously
  io.log = function (message) {
    t.equal(message, 'saved qrcode to: ' + file + '\n', 'Should print the file name')
    t.ok(fs.readFileSync(file, 'utf8').includes('<svg'), 'Should save a svg file')
    t.same(io.exitCodes, [], 'Should not exit')
    t.end()
  }

  run('some text', file, getOptions({ _: [] }), io)
})

test('CLI run - save error', function (t) {
  const file = path.join(tempDir(t), 'out.png')
  const io = recordIO(function () {
    t.equal(io.errors[0][0], 'Error:', 'Should report the error')
    t.same(io.exitCodes, [1], 'Should exit with an error')
    t.same(io.logs, [], 'Should not print the file name')
    t.end()
  })

  run(LONG_TEXT, file, getOptions({ _: [], qversion: 1 }), io)
})

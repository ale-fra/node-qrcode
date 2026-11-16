import { test } from 'tap'
import { PassThrough } from 'stream'
import { readInput } from '../../../../bin/cli/input'
import type { InputStream } from '../../../../bin/cli/input'

test('CLI input - terminal (TTY)', function (t) {
  const stdin: InputStream = {
    isTTY: true,
    setEncoding: function () { t.fail('Should not read from stdin') },
    read: function () { return null },
    on: function () { t.fail('Should not read from stdin') }
  }
  let text

  readInput(stdin, 'from args', function (input) { text = input })

  t.equal(text, 'from args', 'Should synchronously return the text from the arguments')
  t.end()
})

test('CLI input - stream', function (t) {
  const stdin = new PassThrough()

  readInput(stdin, 'from args', function (text) {
    t.equal(text, 'line 1\nline 2', 'Should return the text read from the stream')
    t.end()
  })

  stdin.write('line 1\n')
  stdin.end('line 2')
})

test('CLI input - empty stream', function (t) {
  const stdin = new PassThrough()

  readInput(stdin, 'from args', function (text) {
    t.equal(text, 'from args', 'Should return the text from the arguments')
    t.end()
  })

  stdin.end()
})

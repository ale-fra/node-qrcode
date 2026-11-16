import { test } from 'tap'
import { createParser } from '../../../../bin/cli/parser'
import type { CliArgs } from '../../../../bin/cli/parser'

function parse (args: string[]): CliArgs {
  return createParser(args).parseSync() as unknown as CliArgs
}

test('CLI parser - options', function (t) {
  const args = parse(['-v', '5', '-e', 'H', '-m', '3', '-q', '2', '-w', '200', '-l', 'fff', '-d', '000', '-o', 'out.png', 'some', 'text'])

  t.same(args._, ['some', 'text'], 'Should collect the text to encode')
  t.equal(args.qversion, 5, 'Should parse the version (alias of -v)')
  t.equal(args.error, 'H', 'Should parse the error correction level (alias of -e)')
  t.equal(args.mask, 3, 'Should parse the mask pattern (alias of -m)')
  t.equal(args.qzone, 2, 'Should parse the quiet zone (alias of -q)')
  t.equal(args.width, 200, 'Should parse the width (alias of -w)')
  t.equal(args.lightcolor, 'fff', 'Should keep colors as strings')
  t.equal(args.darkcolor, '000', 'Should keep colors as strings')
  t.equal(args.output, 'out.png', 'Should parse the output file (alias of -o)')
  t.end()
})

test('CLI parser - flags', function (t) {
  const args = parse(['--small', '-i', 'text'])

  t.equal(args.small, true, 'Should parse --small')
  t.equal(args.inverse, true, 'Should parse the inverse flag (alias of -i)')
  t.end()
})

test('CLI parser - numbers in the text', function (t) {
  t.same(parse(['0123', '4.50'])._, ['0123', '4.50'], 'Should not parse the text as numbers')
  t.end()
})

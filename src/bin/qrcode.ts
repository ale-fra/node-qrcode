#!/usr/bin/env node
import { createParser } from './cli/parser'
import type { CliArgs } from './cli/parser'
import { getOptions } from './cli/options'
import { readInput } from './cli/input'
import { run } from './cli/actions'
import type { CliIO } from './cli/actions'

const parser = createParser()
const argv = parser.parseSync() as unknown as CliArgs

const io: CliIO = {
  log: (message) => console.log(message),
  error: (...args) => console.error(...args),
  exit: (code) => process.exit(code),
  showHelp: () => parser.showHelp()
}

readInput(process.stdin, argv._.join(' '), function (text) {
  run(text, argv.output, getOptions(argv), io)
})

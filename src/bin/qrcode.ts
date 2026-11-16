#!/usr/bin/env node
import { createParser } from './cli/parser'
import type { CliArgs } from './cli/parser'
import { getOptions, getOutputType, getPdfOptions } from './cli/options'
import { readInput, getBatchInputs } from './cli/input'
import { run, saveBatch } from './cli/actions'
import type { CliIO } from './cli/actions'

const parser = createParser()
const argv = parser.parseSync() as unknown as CliArgs

const io: CliIO = {
  log: (message) => console.log(message),
  error: (...args) => console.error(...args),
  exit: (code) => process.exit(code),
  showHelp: () => parser.showHelp()
}

readInput(process.stdin, argv.batch ? '' : argv._.join(' '), function (text) {
  const options = getOptions(argv)
  const rendererOpts = getPdfOptions(argv, io.error)
  if (rendererOpts) options.rendererOpts = rendererOpts
  if (argv.batch) {
    const inputs = getBatchInputs(text, argv._)
    if (!inputs.length || !inputs[0].length) {
      io.showHelp()
      return io.exit(1)
    }
    if (!argv.output || getOutputType(argv) !== 'pdf') {
      io.error('Error:', '--batch requires PDF output (e.g. -o codes.pdf)')
      return io.exit(1)
    }
    saveBatch(argv.output, inputs, options, io)
    return
  }
  run(text, argv.output, options, io)
})

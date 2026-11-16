// yargs is an ES module: loaded through require() of ES modules
// (Node.js >= 22.12; no experimental warning from 22.13: see engines in package.json)
import yargs = require('yargs')
import { hideBin } from 'yargs/helpers'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Command line arguments (see createParser())
 */
export interface CliArgs {
  /** positional arguments: the text to encode */
  _: Array<string | number>
  qversion?: number
  error?: string
  type?: string
  small?: boolean
  inverse?: boolean
  mask?: number
  qzone?: number
  width?: number
  scale?: number
  lightcolor?: string
  darkcolor?: string
  output?: string
}

/**
 * Version of the package (bin/cli/parser.js -> package.json).
 * Not left to yargs: it reads the package.json of the folder containing the node_modules
 * folder where yargs is installed, ie. the project of the user (or nothing, if global).
 */
function packageVersion (): string {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')).version
}

/**
 * Returns the command line parser
 *
 * @param args Command line arguments (default: arguments of the process)
 */
export function createParser (args: string[] = hideBin(process.argv)): yargs.Argv {
  return yargs(args)
    // explicit: the name would otherwise be derived from the file name (qrcode.js)
    .scriptName('qrcode')
    .detectLocale(false)
    .usage('Usage: $0 [options] <input string>')
    .option('v', {
      alias: 'qversion',
      description: 'QR Code symbol version (1 - 40)',
      group: 'QR Code options:',
      type: 'number'
    })
    .option('e', {
      alias: 'error',
      description: 'Error correction level',
      choices: ['L', 'M', 'Q', 'H'],
      group: 'QR Code options:'
    })
    .option('m', {
      alias: 'mask',
      description: 'Mask pattern (0 - 7)',
      group: 'QR Code options:',
      type: 'number'
    })
    .option('t', {
      alias: 'type',
      description: 'Output type',
      choices: ['png', 'svg', 'utf8'],
      implies: 'output',
      group: 'Renderer options:'
    })
    .option('i', {
      alias: 'inverse',
      type: 'boolean',
      description: 'Invert colors',
      group: 'Renderer options:'
    })
    .option('w', {
      alias: 'width',
      description: 'Image width (px)',
      conflicts: 'scale',
      group: 'Renderer options:',
      type: 'number'
    })
    .option('s', {
      alias: 'scale',
      description: 'Scale factor',
      conflicts: 'width',
      group: 'Renderer options:',
      type: 'number'
    })
    .option('q', {
      alias: 'qzone',
      description: 'Quiet zone size',
      group: 'Renderer options:',
      type: 'number'
    })
    .option('l', {
      alias: 'lightcolor',
      description: 'Light RGBA hex color',
      group: 'Renderer options:'
    })
    .option('d', {
      alias: 'darkcolor',
      description: 'Dark RGBA hex color',
      group: 'Renderer options:'
    })
    .option('small', {
      type: 'boolean',
      description: 'Output smaller QR code to terminal',
      conflicts: 'type',
      group: 'Renderer options:'
    })
    .option('o', {
      alias: 'output',
      description: 'Output file'
    })
    .help('h')
    .alias('h', 'help')
    .version(packageVersion())
    .example('$0 "some text"', 'Draw in terminal window')
    .example('$0 -o out.png "some text"', 'Save as png image')
    .example('$0 -d F00 -o out.png "some text"', 'Use red as foreground color')
    .parserConfiguration({ 'parse-numbers': false })
}

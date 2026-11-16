// yargs is an ES module: loaded through require() of ES modules
// (Node.js >= 22.12; no experimental warning from 22.13: see engines in package.json)
import yargs = require('yargs')
import { hideBin } from 'yargs/helpers'
import * as fs from 'fs'
import * as path from 'path'

const PAGE_SIZES = ['A4', 'A3', 'A5', 'Letter', 'Legal']

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
  batch?: boolean
  'page-size'?: string
  size?: number
  top?: number
  left?: number
  gap?: number
  columns?: number
  rows?: number
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
      choices: ['png', 'svg', 'utf8', 'pdf'],
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
    .option('page-size', {
      description: 'Page size',
      choices: PAGE_SIZES,
      coerce: function (value: unknown) {
      // case-insensitive: "a4" -> "A4", "letter" -> "Letter"
        const match = PAGE_SIZES.filter(function (name) { return name.toLowerCase() === String(value).toLowerCase() })
        return match.length ? match[0] : value
      },
      defaultDescription: 'A4',
      group: 'PDF options (sizes in mm):'
    })
    .option('size', {
      description: 'QR code size, quiet zone included',
      defaultDescription: '50',
      group: 'PDF options (sizes in mm):',
      type: 'number'
    })
    .option('top', {
      description: 'Distance from the top edge of the page',
      defaultDescription: 'centered',
      group: 'PDF options (sizes in mm):',
      type: 'number'
    })
    .option('left', {
      description: 'Distance from the left edge of the page',
      defaultDescription: 'centered',
      group: 'PDF options (sizes in mm):',
      type: 'number'
    })
    .option('gap', {
      description: 'Space between codes (--batch)',
      defaultDescription: '5',
      group: 'PDF options (sizes in mm):',
      type: 'number'
    })
    .option('columns', {
      description: 'Codes per row (--batch)',
      defaultDescription: 'as many as fit',
      group: 'PDF options (sizes in mm):',
      type: 'number'
    })
    .option('rows', {
      description: 'Rows per page (--batch)',
      defaultDescription: 'as many as fit',
      group: 'PDF options (sizes in mm):',
      type: 'number'
    })
    .option('batch', {
      description: 'One QR code per input line (stdin) or argument, laid out on a grid over as many pages as needed',
      group: 'PDF options (sizes in mm):',
      type: 'boolean'
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
    .example('$0 -o out.pdf --size 40 --top 20 --left 20 "some text"', 'Place a 40 mm QR code on an A4 PDF')
    .example('$0 -o sheet.pdf --batch --size 30 < urls.txt', 'One 30 mm QR code per line, as many pages as needed')
    .parserConfiguration({ 'parse-numbers': false })
}

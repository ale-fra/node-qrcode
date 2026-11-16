import * as qr from '../../lib'
import type { QRCodeToFileOptions, QRCodeToStringOptions } from '../../lib'
import type { CliOptions } from './options'

/**
 * Process interactions (console output, exit), replaceable in tests
 */
export interface CliIO {
  log (message: string): void
  error (...args: unknown[]): void
  exit (code: number): void
  showHelp (): void
}

/**
 * Saves the QR code to a file (format from options.type or file extension)
 */
export function save (file: string, text: string, options: CliOptions, io: CliIO): void {
  // option values are validated by the library
  qr.toFile(file, text, options as QRCodeToFileOptions, function (err) {
    if (err) {
      io.error('Error:', err.message)
      io.exit(1)
      return
    }

    io.log('saved qrcode to: ' + file + '\n')
  })
}

/**
 * Prints the QR code to the terminal
 */
export function print (text: string, options: CliOptions, io: CliIO): void {
  options.type = 'terminal'
  // option values are validated by the library
  qr.toString(text, options as QRCodeToStringOptions, function (err, output) {
    if (err) {
      io.error('Error:', err.message)
      io.exit(1)
      return
    }

    io.log(output)
  })
}

/**
 * Encodes the text: saves it to a file if an output file is specified,
 * prints it to the terminal otherwise.
 * Shows the help (and exits with an error) if there is no text to encode.
 */
export function run (text: string, output: string | undefined, options: CliOptions, io: CliIO): void {
  if (!text.length) {
    io.showHelp()
    io.exit(1)
    return
  }

  if (output) {
    save(output, text, options, io)
  } else {
    print(text, options, io)
  }
}

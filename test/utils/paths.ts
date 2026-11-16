import * as path from 'path'

/** Root of the package */
export const ROOT_DIR = path.resolve(__dirname, '..', '..')

/** Files used as expected output by the tests */
export const FIXTURES_DIR = path.join(ROOT_DIR, 'test', 'fixtures')

/** Compiled command line interface */
export const CLI_PATH = path.join(ROOT_DIR, 'bin', 'qrcode.js')

export function fixture (name: string): string {
  return path.join(FIXTURES_DIR, name)
}

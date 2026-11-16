import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

/**
 * Creates a temporary directory, removed when the test ends.
 * Each test gets its own directory, so that tests never share file paths.
 */
export function tempDir (t: Tap.Test): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrcode-test-'))
  t.teardown(function () {
    fs.rmSync(dir, { recursive: true, force: true })
  })
  return dir
}

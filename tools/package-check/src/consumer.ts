import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { execOrThrow } from './exec'
import { FIXTURES_DIR } from './paths'

export interface Consumer {
  /** consumer project */
  dir: string
  /** installed package */
  packageDir: string
}

/**
 * Creates a project which installs the tarball (with npm, as most users do).
 *
 * It is created outside of the repository, so that nothing can be resolved
 * from the repository node_modules (eg. a missing dependency).
 */
export function createConsumer (tarball: string): Consumer {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrcode-package-check-'))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'consumer', private: true }, null, 2))

  execOrThrow('npm', ['install', '--no-audit', '--no-fund', '--no-package-lock', tarball], dir)
  fs.cpSync(FIXTURES_DIR, dir, { recursive: true })

  return { dir, packageDir: path.join(dir, 'node_modules', 'qrcode') }
}

export function removeConsumer (consumer: Consumer): void {
  fs.rmSync(consumer.dir, { recursive: true, force: true })
}

import * as fs from 'fs'
import * as path from 'path'
import { execOrThrow } from './exec'
import { ROOT_DIR } from './paths'

/**
 * Creates the package tarball as it would be published
 * (`pnpm pack` runs the prepack script: clean build)
 */
export function packPackage (outDir: string): string {
  fs.mkdirSync(outDir, { recursive: true })
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.tgz')) fs.rmSync(path.join(outDir, f))
  }

  execOrThrow('pnpm', ['pack', '--pack-destination', outDir], ROOT_DIR)

  const tarballs = fs.readdirSync(outDir).filter((f) => f.endsWith('.tgz'))
  if (tarballs.length !== 1) throw new Error('Expected one tarball in ' + outDir + ', found: ' + tarballs.join(', '))
  return path.join(outDir, tarballs[0])
}

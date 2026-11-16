import * as fs from 'fs'
import * as path from 'path'

/**
 * A module of the package under test.
 *
 * Loosely typed on purpose: the harness loads any version of the package
 * (original JavaScript or TypeScript build) and probes it with invalid inputs.
 */
export type LooseModule = any

/**
 * Package tree being snapshotted (eg. the original JavaScript implementation,
 * or the TypeScript build)
 */
export class PackageUnderTest {
  readonly root: string

  constructor (root: string) {
    this.root = path.resolve(root)
  }

  /** Loads a module of the package, eg. load('lib/core/mode') */
  load (modulePath: string): LooseModule {
    return require(path.join(this.root, modulePath))
  }

  /** Loads a third-party dependency, resolved from the package */
  loadDependency (name: string): LooseModule {
    return require(require.resolve(name, { paths: [this.root] }))
  }

  /** Absolute path of a file of the package */
  file (relativePath: string): string {
    return path.join(this.root, relativePath)
  }

  packageJson (): { version: string, bin: string | Record<string, string> } {
    return JSON.parse(fs.readFileSync(this.file('package.json'), 'utf8'))
  }
}

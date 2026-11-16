/**
 * Checks that the Node.js version matches devEngines.runtime.version of
 * package.json (eg. ">=22.18"): pnpm does not check devEngines.
 * Run first by the build and test scripts.
 */
import * as fs from 'fs'
import * as path from 'path'

const PACKAGE_JSON = path.resolve(__dirname, '..', '..', 'package.json')

/**
 * Compares two versions (major.minor.patch, missing parts are 0)
 */
export function compareVersions (a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Returns the minimum version of a ">=x.y.z" range
 */
export function minimumVersion (range: string): string {
  const match = /^>=\s*(\d+(\.\d+){0,2})$/.exec(range.trim())
  if (!match) throw new Error('Unsupported version range (expected ">=x.y.z"): ' + range)
  return match[1]
}

if (require.main === module) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'))
  const required = minimumVersion(pkg.devEngines.runtime.version)

  if (compareVersions(process.versions.node, required) < 0) {
    console.error('Node.js ' + process.versions.node + ' is not supported for development: ' +
      'Node.js >= ' + required + ' is required (see .nvmrc)')
    process.exit(1)
  }
}

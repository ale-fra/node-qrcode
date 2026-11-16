/**
 * Published files: entry points, no unexpected files, no stale compiled files,
 * source maps which can be resolved
 */
import * as fs from 'fs'
import * as path from 'path'
import type { Report } from '../report'

/** Top level entries of the published package */
const PUBLISHED = ['README.md', 'bin', 'build', 'helper', 'lib', 'license', 'package.json', 'src']

interface PackageJson {
  main: string
  types: string
  browser: Record<string, string | false>
  bin: Record<string, string>
}

function listFiles (dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(file) : [file]
  })
}

function assertFiles (packageDir: string, files: string[]): void {
  const missing = files.filter((f) => !fs.existsSync(path.join(packageDir, f)))
  if (missing.length) throw new Error('Missing: ' + missing.join(', '))
}

export function checkContents (report: Report, packageDir: string): void {
  const pkg: PackageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
  const files = listFiles(packageDir).map((f) => path.relative(packageDir, f))

  report.check('only the expected top level entries are published', () => {
    const unexpected = fs.readdirSync(packageDir).filter((e) => !PUBLISHED.includes(e))
    if (unexpected.length) throw new Error('Unexpected: ' + unexpected.join(', '))
  })

  report.check('package.json entry points exist (main, types, browser, bin)', () => {
    const browserFiles = Object.entries(pkg.browser).flatMap(([from, to]) => to === false ? [] : [from, to])
      .filter((f) => f.startsWith('./'))
    assertFiles(packageDir, [pkg.main, pkg.types, ...browserFiles, ...Object.values(pkg.bin)])
  })

  report.check('documented files exist (helper, browser bundles and their types)', () => {
    assertFiles(packageDir, [
      'helper/to-sjis.js', 'helper/to-sjis.d.ts',
      'build/qrcode.js', 'build/qrcode.d.ts', 'build/qrcode.tosjis.js', 'build/qrcode.tosjis.d.ts'
    ])
  })

  report.check('every compiled file has its TypeScript source (no stale file)', () => {
    const stale = files.filter((f) => /^(lib|helper|bin)\/.*\.js$/.test(f))
      .filter((f) => !fs.existsSync(path.join(packageDir, 'src', f.replace(/\.js$/, '.ts'))))
    if (stale.length) throw new Error('No source for: ' + stale.join(', '))
  })

  report.check('source maps can be resolved (sources published or embedded)', () => {
    const unresolved: string[] = []
    for (const map of files.filter((f) => f.endsWith('.map'))) {
      const content = JSON.parse(fs.readFileSync(path.join(packageDir, map), 'utf8'))
      content.sources.forEach((source: string, i: number) => {
        const embedded = content.sourcesContent && content.sourcesContent[i] != null
        if (!embedded && !fs.existsSync(path.resolve(path.dirname(path.join(packageDir, map)), source))) {
          unresolved.push(map + ': ' + source)
        }
      })
    }
    if (unresolved.length) throw new Error('Unresolved: ' + unresolved.slice(0, 5).join(', '))
  })
}

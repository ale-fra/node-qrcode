/**
 * Keeps the compiled files (lib/, helper/, bin/) consistent with src/ before an
 * incremental build (`tsc -b`):
 *
 * - missing outputs: `tsc -b` relies on its build info (.cache/tsc/src.tsbuildinfo)
 *   and emits nothing when compiled files are deleted (eg. `rm -rf lib`): the
 *   build info is removed, so that the next `tsc -b` does a full build
 * - stale outputs: `tsc -b` does not remove the outputs of deleted sources:
 *   they are removed (the output folders only contain compiled files)
 */
import * as fs from 'fs'
import * as path from 'path'

const ROOT_DIR = path.resolve(__dirname, '..', '..')
const SRC_DIR = path.join(ROOT_DIR, 'src')
const OUTPUT_DIRS = ['lib', 'helper', 'bin']
const BUILD_INFO = path.join(ROOT_DIR, '.cache', 'tsc', 'src.tsbuildinfo')

/** Files emitted for one source: .js, .d.ts and their maps */
const OUTPUT_EXTENSIONS = ['.js', '.js.map', '.d.ts', '.d.ts.map']

function listFiles (dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (entry) {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(file) : [file]
  })
}

/**
 * Lists the TypeScript sources which are compiled (declaration files excluded)
 */
function listSources (): string[] {
  return listFiles(SRC_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
}

/**
 * Returns the compiled files which are missing
 * (src/lib/index.ts compiles to lib/index.js, see src/tsconfig.json)
 */
export function findMissingOutputs (): string[] {
  return listSources()
    .map((file) => path.join(ROOT_DIR, path.relative(SRC_DIR, file)).replace(/\.ts$/, '.js'))
    .filter((file) => !fs.existsSync(file))
}

/**
 * Returns the compiled files whose source does not exist anymore
 */
export function findStaleOutputs (): string[] {
  return OUTPUT_DIRS.flatMap((dir) => listFiles(path.join(ROOT_DIR, dir))).filter((file) => {
    const ext = OUTPUT_EXTENSIONS.find((e) => file.endsWith(e))
    if (!ext) return false
    const source = path.join(SRC_DIR, path.relative(ROOT_DIR, file.slice(0, -ext.length) + '.ts'))
    return !fs.existsSync(source)
  })
}

if (require.main === module) {
  const missing = findMissingOutputs()
  if (missing.length > 0 && fs.existsSync(BUILD_INFO)) {
    fs.rmSync(BUILD_INFO)
    console.log(missing.length + ' compiled file(s) missing (eg. ' +
      path.relative(ROOT_DIR, missing[0]) + '): full build')
  }

  const stale = findStaleOutputs()
  for (const file of stale) fs.rmSync(file)
  if (stale.length > 0) {
    console.log(stale.length + ' stale compiled file(s) removed (eg. ' + path.relative(ROOT_DIR, stale[0]) + ')')
  }
}

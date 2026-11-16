/**
 * Reference snapshot: the original JavaScript implementation.
 *
 *   tsx tools/migration-check/src/reference.ts <out.json[.gz]>
 *
 * The reference is not committed (it is a generated file): it is re-created
 * from git history. The reference commit is extracted (git archive) into a
 * temporary folder, installed with its own lockfile (so that the browser
 * bundles are built with the original toolchain), built and snapshotted.
 * Nothing is done if the output file already exists.
 */
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { takeSnapshot } from './snapshot/take-snapshot'
import { writeSnapshot } from './snapshot-file'

/**
 * Available upstream JavaScript implementation (1.5.4). The foreign snapshot
 * referenced monorepo commit 0558146, which is not present in this repository.
 * The tag keeps the commit reachable if the branch history is rewritten (eg. squash merge);
 * the commit hash is used if the tag is not available (eg. tags not fetched).
 */
const REFERENCE_TAG = 'migration-reference/upstream-1.5.4'
const REFERENCE_COMMIT = '3848ed2c17de5bcdead487417dbf14c5dd017f8d'

function resolveReference (repoRoot: string): string {
  try {
    const tagged = execFileSync('git', ['rev-parse', '--verify', '--quiet', REFERENCE_TAG + '^{commit}'], { cwd: repoRoot, encoding: 'utf8' }).trim()
    if (tagged !== REFERENCE_COMMIT) throw new Error('Reference tag does not match pinned base')
    return tagged
  } catch (e) {
    return REFERENCE_COMMIT
  }
}

function run (command: string, args: string[], cwd: string): void {
  console.log('> ' + command + ' ' + args.join(' '))
  execFileSync(command, args, { cwd, stdio: 'inherit' })
}

/**
 * Extracts, installs and builds the reference commit. Returns the package root.
 */
function prepareReferenceTree (): string {
  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
  const reference = resolveReference(repoRoot)
  const dir = path.join(os.tmpdir(), 'qrcode-migration-reference-' + reference.slice(0, 7))
  const packageRoot = dir

  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })

  const archive = path.join(dir, 'reference.tar')
  run('git', ['archive', '--format=tar', '--output=' + archive, reference], repoRoot)
  run('tar', ['-xf', archive], dir)
  fs.rmSync(archive)

  // Reference native canvas is unused: the harness owns its canvas implementation.
  // Disable lifecycle scripts; build the inspected reference explicitly below.
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], packageRoot)
  run('npm', ['run', 'build'], packageRoot)

  return packageRoot
}

async function main (outFile: string): Promise<void> {
  if (fs.existsSync(outFile)) {
    console.log('reference snapshot: ' + outFile + ' (existing)')
    return
  }

  const recorder = await takeSnapshot(prepareReferenceTree())
  writeSnapshot(outFile, recorder)
  console.log('reference snapshot: ' + recorder.size + ' entries -> ' + outFile)
}

const [outFile] = process.argv.slice(2)
if (!outFile) {
  console.error('Usage: reference <out.json[.gz]>')
  process.exit(2)
}

main(path.resolve(outFile)).catch((e) => {
  console.error(e)
  process.exit(1)
})

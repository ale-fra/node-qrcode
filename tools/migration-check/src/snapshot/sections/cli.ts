/**
 * Command line interface (run as a child process)
 */
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { sha } from '../hash'
import type { SnapshotContext } from '../context'

interface CliResult {
  out?: string
  code?: number
  stderr?: string
}

const CASES: Array<[string[], string?]> = [
  [['hello world']], [['-s', '2', 'hello']], [['--small', 'hi']], [['--small', '-i', 'hi']],
  [['-e', 'H', '-v', '5', 'hi']], [['-m', '3', 'hi']], [['-e', 'X', 'hi']], [['-v', '1', 'x'.repeat(200)]],
  [[], 'from stdin'], [['-h']], [['--version']], [['-t', 'svg', 'x']], [['-w', '10', '-s', '2', 'x']]
]

const FILE_CASES: Array<[string, string[]]> = [
  ['o.png', []], ['o.svg', []], ['o.txt', []], ['o2.png', ['-d', 'F00', '-l', '0F0A', '-q', '1', '-w', '300']],
  ['o3.svg', ['-t', 'svg']], ['o4.txt', ['-t', 'utf8', '-q', '2']]
]

export function snapshotCli ({ pkg, recorder }: SnapshotContext): void {
  const { bin } = pkg.packageJson()
  const cliPath = pkg.file(typeof bin === 'string' ? bin : bin.qrcode)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrcli-'))

  const run = (args: string[], input: string): CliResult => {
    try {
      return { out: execFileSync(process.execPath, [cliPath].concat(args), { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) }
    } catch (e) {
      const err = e as { status: number, stderr: unknown, stdout: string }
      return { code: err.status, stderr: String(err.stderr).split('\n')[0], out: err.stdout }
    }
  }

  const out: Record<string, unknown> = {}
  // help text without layout (whitespace), compared separately from the exact output
  const help = run(['-h'], '').out || ''
  out.helpText = sha(help.replace(/\s+/g, ' '))

  for (const [args, input] of CASES) {
    const r = run(args, input === undefined ? '' : input)
    if (r.out && r.out.length > 400) r.out = sha(r.out)
    out[JSON.stringify(args) + (input ? '<' + input : '')] = r
  }
  for (const [name, args] of FILE_CASES) {
    const file = path.join(dir, name)
    const r = run(['-o', file].concat(args).concat(['some text']), '')
    out['file:' + name] = { out: r.out && r.out.replace(file, '<file>'), code: r.code, file: fs.existsSync(file) ? sha(fs.readFileSync(file)) : null }
  }

  fs.rmSync(dir, { recursive: true, force: true })
  recorder.record('cli', out)
}

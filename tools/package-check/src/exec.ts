import { spawnSync } from 'child_process'

export interface ExecResult {
  status: number | null
  stdout: string
  stderr: string
}

export function exec (command: string, args: string[], cwd: string, input?: string): ExecResult {
  const result = spawnSync(command, args, { cwd, input, encoding: 'utf8' })
  if (result.error) throw result.error
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

/**
 * Runs a command and throws if it fails (with its output)
 */
export function execOrThrow (command: string, args: string[], cwd: string): string {
  const result = exec(command, args, cwd)
  if (result.status !== 0) {
    throw new Error('`' + [command].concat(args).join(' ') + '` failed (exit ' + result.status + ')\n' +
      (result.stdout + result.stderr).trim())
  }
  return result.stdout
}

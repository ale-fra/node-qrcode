/**
 * Runtime use of the installed package: CommonJS, ES modules, TypeScript
 * (type stripping), command line interface
 */
import * as fs from 'fs'
import * as path from 'path'
import { exec } from '../exec'
import type { Consumer } from '../consumer'
import type { Report } from '../report'

function runNode (consumer: Consumer, file: string): void {
  const result = exec(process.execPath, [file], consumer.dir)
  if (result.status !== 0) throw new Error((result.stdout + result.stderr).trim())
}

export function checkRuntime (report: Report, consumer: Consumer): void {
  report.check('require() (CommonJS)', () => runNode(consumer, 'runtime/cjs.cjs'))
  report.check('import (ES module)', () => runNode(consumer, 'runtime/esm.mjs'))
  report.check('README TypeScript example', () => runNode(consumer, 'runtime/readme.mts'))

  const cli = path.join(consumer.dir, 'node_modules', '.bin', 'qrcode')
  const pkg = JSON.parse(fs.readFileSync(path.join(consumer.packageDir, 'package.json'), 'utf8'))

  report.check('CLI: --version', () => {
    const out = exec(cli, ['--version'], consumer.dir).stdout.trim()
    if (out !== pkg.version) throw new Error('Got ' + JSON.stringify(out) + ', expected ' + pkg.version)
  })

  report.check('CLI: terminal output', () => {
    const result = exec(cli, ['--small', 'hello'], consumer.dir, '')
    if (result.status !== 0 || !result.stdout.includes('█')) throw new Error(result.stderr || result.stdout)
  })

  report.check('CLI: png file', () => {
    const file = path.join(consumer.dir, 'cli.png')
    const result = exec(cli, ['-o', file, 'hello'], consumer.dir, '')
    if (result.status !== 0) throw new Error(result.stderr)
    const signature = fs.readFileSync(file).subarray(0, 4).toString('hex')
    if (signature !== '89504e47') throw new Error('Not a png file')
  })
}

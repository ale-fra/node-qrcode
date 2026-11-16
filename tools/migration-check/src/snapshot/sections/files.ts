/**
 * toFile() (format from type or extension) and toFileStream()
 */
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { PassThrough } from 'stream'
import { sha } from '../hash'
import { callbackResult, promiseResult } from '../results'
import type { SnapshotContext } from '../context'

type FileCase = [string, unknown, Record<string, unknown> | undefined]

const CASES: FileCase[] = [
  ['a.png', 'pony', undefined], ['b.svg', 'pony', undefined], ['c.txt', 'pony', undefined],
  ['d.PNG', 'pony', { margin: 0 }], ['e.noext', 'pony', undefined], ['f.txt', 'pony', { type: 'svg' }],
  ['g.svg', 'pony', { type: 'utf8', margin: 2 }], ['h.png', [{ data: 'SEG' }], { scale: 2 }], ['i.png', 'x'.repeat(9000), undefined]
]

function fileHash (file: string): string | null {
  return fs.existsSync(file) ? sha(fs.readFileSync(file)) : null
}

export async function snapshotFiles ({ recorder, modules }: SnapshotContext): Promise<void> {
  const { QRCode } = modules
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrsnap-'))
  const out: Record<string, unknown> = {}

  for (const [name, text, opts] of CASES) {
    const file = path.join(dir, name)
    const r = await callbackResult((cb) => opts ? QRCode.toFile(file, text, opts, cb) : QRCode.toFile(file, text, cb))
    out['cb:' + name] = { r, file: fileHash(file) }
    const file2 = path.join(dir, 'p-' + name)
    const r2 = await promiseResult(() => QRCode.toFile(file2, text, opts))
    out['p:' + name] = { r: r2, file: fileHash(file2) }
  }

  const streamFile = path.join(dir, 'stream.png')
  await new Promise<void>((resolve) => {
    const ws = fs.createWriteStream(streamFile)
    ws.on('close', () => resolve())
    QRCode.toFileStream(ws, 'stream me', { margin: 2 })
  })
  out.stream = sha(fs.readFileSync(streamFile))

  const errs: string[] = []
  await new Promise<void>((resolve) => {
    const s = new PassThrough()
    s.on('error', (e) => { errs.push(e.message); resolve() })
    QRCode.toFileStream(s, 'x'.repeat(9000))
  })
  out.streamErr = errs

  fs.rmSync(dir, { recursive: true, force: true })
  recorder.record('files', out)
}

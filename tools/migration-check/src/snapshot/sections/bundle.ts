import { createCanvas } from '@napi-rs/canvas'
/**
 * Browser bundles (build/qrcode.js, build/qrcode.tosjis.js), run in a VM context
 */
import * as fs from 'fs'
import * as vm from 'vm'
import { sha } from '../hash'
import { qrSummary } from '../qr-summary'
import type { SnapshotContext } from '../context'
import type { LooseModule } from '../package-under-test'

export function snapshotBundle ({ pkg, recorder }: SnapshotContext): void {
  const file = pkg.file('build/qrcode.js')
  if (!fs.existsSync(file)) {
    recorder.record('bundle', 'missing')
    return
  }

  const ctx: Record<string, any> = { window: {}, TextEncoder, document: { createElement: () => createCanvas(1, 1) } }
  ctx.self = ctx.window
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx)

  const Q: LooseModule = ctx.QRCode || ctx.window.QRCode
  const out: Record<string, unknown> = { keys: Object.keys(Q).sort() }
  Q.toString('bundle', { margin: 1 }, (err: Error, s: string) => { out.svg = err ? err.message : sha(s) })
  const c = createCanvas(1, 1)
  Q.toCanvas(c, 'bundle', (err: Error) => { out.canvas = err ? err.message : [c.width, sha(Buffer.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data))] })
  out.create = qrSummary(Q.create('bundle test 123'))

  const sjisFile = pkg.file('build/qrcode.tosjis.js')
  if (fs.existsSync(sjisFile)) {
    vm.runInContext(fs.readFileSync(sjisFile, 'utf8'), ctx)
    out.tosjis = typeof Q.toSJIS === 'function' ? Q.toSJIS('漢') : 'missing'
  }

  recorder.record('bundle', out)
}

import { createCanvas, Canvas } from '@napi-rs/canvas'
/**
 * Browser entry point, with @napi-rs/canvas
 * (images are compared by pixels: PNG encoders differ between canvas implementations)
 */
import { sha } from '../hash'
import type { SnapshotContext } from '../context'
import type { LooseModule } from '../package-under-test'

type DocumentHolder = { document?: unknown }

export async function snapshotBrowser ({ pkg, recorder, corpus, modules }: SnapshotContext): Promise<void> {
  const { PNG } = pkg.loadDependency('pngjs')
  const Browser = pkg.load('lib/browser')
  const out: Record<string, unknown> = {}

  const px = (c: LooseModule): string => sha(Buffer.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data))
  const decodeUrl = (u: unknown): unknown => {
    if (typeof u !== 'string') return u
    const [head, b64] = u.split(',')
    if (head !== 'data:image/png;base64') return head
    const p = PNG.sync.read(Buffer.from(b64, 'base64'))
    return head + ':' + p.width + 'x' + p.height + ':' + sha(p.data)
  }

  ;(globalThis as DocumentHolder).document = { createElement: (el: string) => el === 'canvas' ? createCanvas(10, 10) : null }

  for (const [i, o] of corpus.renderOptions.entries()) {
    const c = createCanvas(10, 10) as Canvas & { style?: { width?: string } }
    out['toCanvas:cb:' + i] = await new Promise((resolve) => Browser.toCanvas(c, 'pony ' + i, o || {}, (err: Error) => resolve(err ? err.message : [c.width, c.style && c.style.width, px(c)])))
    out['toCanvas:p:' + i] = await Browser.toCanvas('pony ' + i, o).then((cv: LooseModule) => [cv instanceof Canvas, cv.width, px(cv)], (e: Error) => e.message)
    out['toDataURL:p:' + i] = await Browser.toDataURL('pony ' + i, o).then(decodeUrl, (e: Error) => e.message)
    out['toDataURL:jpeg:' + i] = await Browser.toDataURL(createCanvas(1, 1), 'pony ' + i, Object.assign({ type: 'image/jpeg', rendererOpts: { quality: 0.5 } }, o)).then((u: string) => u.slice(0, 23), (e: Error) => e.message)
    out['toString:' + i] = await Browser.toString('pony ' + i, o).then((s: string) => sha(s), (e: Error) => e.message)
  }

  const argForms: Record<string, (cb: (err: Error | null, r?: any) => void) => void> = {
    'toCanvas(text,cb)': (cb) => Browser.toCanvas('t', cb),
    'toCanvas(canvas,text,cb)': (cb) => Browser.toCanvas(createCanvas(1, 1), 't', cb),
    'toCanvas(text,opts,cb)': (cb) => Browser.toCanvas('t', { margin: 0 }, cb),
    'toCanvas(canvas,text,opts,cb)': (cb) => Browser.toCanvas(createCanvas(1, 1), 't', { margin: 0 }, cb),
    'toDataURL(text,cb)': (cb) => Browser.toDataURL('t', cb),
    'toDataURL(canvas,text,cb)': (cb) => Browser.toDataURL(createCanvas(1, 1), 't', cb),
    'toString(text,cb)': (cb) => Browser.toString('t', cb),
    'toString(text,opts,cb)': (cb) => Browser.toString('t', { margin: 1, width: 100 }, cb),
    'toCanvas(cb)': (cb) => Browser.toCanvas(cb),
    'toCanvas(bigtext,cb)': (cb) => Browser.toCanvas('x'.repeat(9000), cb)
  }
  for (const [k, fn] of Object.entries(argForms)) {
    out['args:' + k] = await new Promise((resolve) => {
      try {
        fn((err, r) => resolve(err ? 'err:' + err.message : (r && r.getContext ? 'canvas:' + r.width + ':' + px(r) : (typeof r === 'string' && r.startsWith('data:') ? decodeUrl(r) : sha(String(r))))))
      } catch (e) { resolve('threw:' + (e as Error).message) }
    })
  }

  ;(globalThis as DocumentHolder).document = undefined
  out.noCanvas = await Browser.toCanvas('t').then(() => 'ok', (e: Error) => e.message)
  out.serverToCanvas = modules.QRCode.toCanvas === undefined ? 'undefined' : typeof modules.QRCode.toCanvas

  recorder.record('browser', out)
}

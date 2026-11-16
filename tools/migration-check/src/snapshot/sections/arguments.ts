/**
 * Public API argument validation, including malformed options
 */
import * as os from 'os'
import * as path from 'path'
import type { SnapshotContext } from '../context'
import type { Job } from './jobs'

export function argumentJobs ({ modules }: SnapshotContext): Job[] {
  const { QRCode } = modules
  const cases: Record<string, () => any> = {
    'toString()': () => QRCode.toString(),
    'toDataURL()': () => QRCode.toDataURL(),
    'toBuffer()': () => QRCode.toBuffer(),
    'toFile()': () => QRCode.toFile(),
    'toFile(1,2)': () => QRCode.toFile(1, 2),
    'toFile(path)': () => QRCode.toFile('x.png'),
    'toFileStream()': () => QRCode.toFileStream(),
    'toFileStream(s)': () => QRCode.toFileStream({}),
    'create()': () => QRCode.create(),
    'toString(text,{},notfn)': () => QRCode.toString('x', {}, 'notfn'),
    'toString(null opts cb)': () => QRCode.toString('x', null, () => {}),
    'toDataURL(text,"",cb)': () => QRCode.toDataURL('x', '', () => {}),
    // malformed options (strict mode: writing properties on primitives throws)
    'toString(text,5)': () => QRCode.toString('x', 5),
    'toString(text,true)': () => QRCode.toString('x', true),
    'toString(text,"svg")': () => QRCode.toString('x', 'svg'),
    'toDataURL(text,"png")': () => QRCode.toDataURL('x', 'png'),
    'toBuffer(text,7)': () => QRCode.toBuffer('x', 7),
    'toString(text,{color:"red"})': () => QRCode.toString('x', { color: 'red' }),
    'toString(text,{color:5})': () => QRCode.toString('x', { color: 5 }),
    'toDataURL(text,{rendererOpts:"x"})': () => QRCode.toDataURL('x', { rendererOpts: 'x' }),
    'toDataURL(text,{rendererOpts:5})': () => QRCode.toDataURL('x', { rendererOpts: 5 }),
    'toBuffer(text,{rendererOpts:true})': () => QRCode.toBuffer('x', { rendererOpts: true }),
    'toFile(png,text,"x")': () => QRCode.toFile(path.join(os.tmpdir(), 'qrsnap-bad.png'), 'x', 'x'),
    'create(text,"x")': () => QRCode.create('x', 'x'),
    'create(text,5)': () => QRCode.create('x', 5),
    'create(text,{toSJISFunc:5})': () => QRCode.create('x', { toSJISFunc: 5 }),
    'toString(text,{margin:"2"})': () => QRCode.toString('x', { margin: '2' }),
    'toString(text,{scale:"2",width:"100"})': () => QRCode.toDataURL('x', { scale: '2', width: '100' })
  }

  return Object.entries(cases).map(([name, fn]): Job => ['args:' + name, () => {
    let r
    try { r = fn() } catch (e) { return Promise.resolve({ threw: (e as Error).message }) }
    if (r && typeof r.then === 'function') {
      return r.then((v: unknown) => ({ resolved: typeof v }), (e: any) => ({ rejected: String(e && e.message) }))
    }
    return Promise.resolve({ returned: typeof r })
  }])
}

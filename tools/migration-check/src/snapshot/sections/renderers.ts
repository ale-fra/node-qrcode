/**
 * Renderers through the public API: every text x options x output type,
 * with callbacks and promises
 */
import { callbackResult, promiseResult } from '../results'
import type { SnapshotContext } from '../context'
import type { Job } from './jobs'

const STRING_TYPES = [undefined, 'utf8', 'svg', 'terminal', 'png', 'bogus']
const IMAGE_TYPES = [undefined, 'png', 'image/png', 'image/jpeg', 'svg', 'utf8', 'txt']

export function rendererJobs ({ corpus, modules }: SnapshotContext): Job[] {
  const { QRCode } = modules
  const texts: unknown[] = ['i am a pony!', 'HELLO 123', corpus.randomInputs[0], [{ data: 'SEG', mode: 'alphanumeric' }, 'mixed']]
  const jobs: Job[] = []

  texts.forEach((text, ti) => corpus.renderOptions.forEach((o, oi) => {
    STRING_TYPES.forEach((type) => {
      const opts = o === undefined && type === undefined ? undefined : Object.assign({}, o, { type })
      jobs.push([`toString:${ti}:${oi}:${type}:cb`, () => callbackResult((cb) => opts === undefined ? QRCode.toString(text, cb) : QRCode.toString(text, opts, cb))])
      jobs.push([`toString:${ti}:${oi}:${type}:p`, () => promiseResult(() => QRCode.toString(text, opts))])
    })
    IMAGE_TYPES.forEach((type) => {
      const opts = o === undefined && type === undefined ? undefined : Object.assign({}, o, { type })
      jobs.push([`toDataURL:${ti}:${oi}:${type}:cb`, () => callbackResult((cb) => opts === undefined ? QRCode.toDataURL(text, cb) : QRCode.toDataURL(text, opts, cb))])
      jobs.push([`toBuffer:${ti}:${oi}:${type}:p`, () => promiseResult(() => QRCode.toBuffer(text, opts))])
    })
  }))

  return jobs
}

import { sha } from './hash'

type Callback = (err: any, data?: any) => void

/**
 * Outcome of a synchronous call: returned value or thrown error message
 */
export function safe (fn: () => unknown): { ok: unknown } | { threw: unknown } {
  try {
    return { ok: fn() }
  } catch (e) {
    return { threw: e && (e as Error).message }
  }
}

/**
 * Big outputs are stored as hashes
 */
function describeData (data: unknown): unknown {
  if (Buffer.isBuffer(data)) return 'buf:' + sha(data)
  if (typeof data === 'string' && data.length > 400) return 'str:' + sha(data)
  return data
}

function errorMessage (err: any): string {
  return String(err && err.message ? err.message : err)
}

/**
 * Outcome of a callback-style call: number of callback calls, their results,
 * and the value returned by the call itself (eg. toString() returns the output)
 */
export function callbackResult (fn: (cb: Callback) => unknown): Promise<unknown> {
  return new Promise((resolve) => {
    let calls = 0
    const results: unknown[] = []
    try {
      const returned = fn((err, data) => {
        calls++
        results.push(err ? { err: errorMessage(err) } : { data: describeData(data) })
        setImmediate(() => resolve({ calls, results, returned: typeof returned === 'string' ? sha(returned) : typeof returned }))
      })
    } catch (e) {
      resolve({ threw: (e as Error).message })
    }
  })
}

/**
 * Outcome of a promise-style call: resolved data, rejection or thrown error
 */
export function promiseResult (fn: () => Promise<unknown>): Promise<unknown> {
  let p
  try { p = fn() } catch (e) { return Promise.resolve({ threw: (e as Error).message }) }
  return p.then(
    (data) => ({ data: describeData(data) }),
    (e) => ({ rejected: errorMessage(e) }))
}

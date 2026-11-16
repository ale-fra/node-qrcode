import * as fs from 'fs'
import type { Difference } from './diff'

/**
 * Known and accepted difference (see expected-differences.json)
 */
export interface ExpectedDifference {
  /** regular expression matching the difference path */
  path: string
  reason: string
  /** regular expression the reference value must match */
  refMatches?: string
  /** regular expression the candidate value must match */
  candMatches?: string
}

export function loadExpectedDifferences (file: string | undefined): ExpectedDifference[] {
  return file ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
}

export function findExpected (expected: ExpectedDifference[], d: Difference): ExpectedDifference | undefined {
  return expected.find((e) => new RegExp(e.path).test(d.path) &&
    (!e.refMatches || new RegExp(e.refMatches).test(String(d.ref))) &&
    (!e.candMatches || new RegExp(e.candMatches).test(String(d.cand))))
}

/**
 * Compares two snapshots produced by snapshot.ts
 *
 *   tsx tools/migration-check/src/compare.ts <reference.json[.gz]> <candidate.json[.gz]> [expected-differences.json]
 *
 * Exits with code 1 if there is any unexpected difference.
 */
import * as util from 'util'
import { diff } from './compare/diff'
import { findExpected, loadExpectedDifferences } from './compare/expected'
import type { ExpectedDifference } from './compare/expected'
import { readSnapshot } from './snapshot-file'

const MAX_REPORTED = 50

function compare (refFile: string, candFile: string, expectedFile?: string): number {
  const ref = readSnapshot(refFile)
  const cand = readSnapshot(candFile)
  const expected = loadExpectedDifferences(expectedFile)

  const keys = new Set(Object.keys(ref).concat(Object.keys(cand)))
  const accepted = new Map<ExpectedDifference, number>()
  let unexpected = 0

  for (const k of keys) {
    for (const d of diff(ref[k], cand[k], k)) {
      const e = findExpected(expected, d)
      if (e) {
        accepted.set(e, (accepted.get(e) || 0) + 1)
        continue
      }

      unexpected++
      if (unexpected <= MAX_REPORTED) {
        console.log('DIFF ' + d.path +
          '\n  ref : ' + util.inspect(d.ref, { depth: 4, breakLength: 200 }) +
          '\n  cand: ' + util.inspect(d.cand, { depth: 4, breakLength: 200 }))
      }
    }
  }

  for (const [e, n] of accepted) console.log('EXPECTED x' + n + ' ' + e.path + '\n  ' + e.reason)
  const expectedCount = [...accepted.values()].reduce((a, b) => a + b, 0)
  console.log(keys.size + ' entries compared, ' + unexpected + ' unexpected difference(s)' +
    (expectedCount ? ', ' + expectedCount + ' expected' : ''))

  return unexpected
}

const [refFile, candFile, expectedFile] = process.argv.slice(2)
if (!refFile || !candFile) {
  console.error('Usage: compare <reference.json> <candidate.json> [expected-differences.json]')
  process.exit(2)
}

process.exit(compare(refFile, candFile, expectedFile) ? 1 : 0)

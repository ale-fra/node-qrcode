/**
 * Module surface: what can be require()'d and what it exposes
 */
import type { SnapshotContext } from '../context'
import type { LooseModule } from '../package-under-test'

const MODULES = [
  'lib/index', 'lib/server', 'lib/browser', 'lib/can-promise',
  'lib/core/alignment-pattern', 'lib/core/alphanumeric-data', 'lib/core/bit-buffer',
  'lib/core/bit-matrix', 'lib/core/byte-data', 'lib/core/error-correction-code',
  'lib/core/error-correction-level', 'lib/core/finder-pattern', 'lib/core/format-info',
  'lib/core/galois-field', 'lib/core/kanji-data', 'lib/core/mask-pattern', 'lib/core/mode',
  'lib/core/numeric-data', 'lib/core/polynomial', 'lib/core/qrcode',
  'lib/core/reed-solomon-encoder', 'lib/core/regex', 'lib/core/segments', 'lib/core/utils',
  'lib/core/version-check', 'lib/core/version',
  'lib/renderer/canvas', 'lib/renderer/png', 'lib/renderer/svg-tag', 'lib/renderer/svg',
  'lib/renderer/terminal', 'lib/renderer/utf8', 'lib/renderer/utils',
  'lib/renderer/terminal/terminal', 'lib/renderer/terminal/terminal-small',
  'helper/to-sjis'
]

const FUNCTION_OWN_PROPERTIES = ['length', 'name', 'prototype', 'arguments', 'caller']

function describe (value: LooseModule): unknown {
  if (typeof value !== 'function') return typeof value
  const proto = value.prototype ? Object.getOwnPropertyNames(value.prototype).filter((k) => k !== 'constructor').sort() : []
  // own properties, whatever their enumerability (ES class statics are not enumerable)
  const statics = Object.getOwnPropertyNames(value).filter((k) => !FUNCTION_OWN_PROPERTIES.includes(k)).sort()
  const staticTypes = statics.map((k) => typeof value[k])
  return { fn: true, proto, statics, staticTypes, enumerableStatics: Object.keys(value).sort() }
}

function surface (mod: LooseModule): unknown {
  if (typeof mod === 'function') return describe(mod)
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(mod).sort()) {
    if (k === '__esModule') continue
    out[k] = describe(mod[k])
  }
  return out
}

export function snapshotSurface ({ pkg, recorder }: SnapshotContext): void {
  for (const m of MODULES) recorder.record('surface:' + m, surface(pkg.load(m)))
}

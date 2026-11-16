/**
 * Difference between two snapshot values, at a given path
 */
export interface Difference {
  path: string
  ref: unknown
  cand: unknown
}

/**
 * Deep diff of two JSON values: returns the leaf differences
 */
export function diff (ref: unknown, cand: unknown, path: string, out: Difference[] = []): Difference[] {
  if (JSON.stringify(ref) === JSON.stringify(cand)) return out

  if (ref && cand && typeof ref === 'object' && typeof cand === 'object' && !Array.isArray(ref) === !Array.isArray(cand)) {
    const a = ref as Record<string, unknown>
    const b = cand as Record<string, unknown>
    const keys = new Set(Object.keys(a).concat(Object.keys(b)))
    for (const k of keys) diff(a[k], b[k], path + (Array.isArray(ref) ? '[' + k + ']' : '.' + k), out)
    return out
  }

  out.push({ path, ref, cand })
  return out
}

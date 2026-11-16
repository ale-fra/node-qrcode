/**
 * Deterministic random input generation
 */

export const ALPHABETS: Record<string, string> = {
  num: '0123456789',
  alnum: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',
  byte: 'abcdefghijklmnopqrstuvwxyz!"#&\'()<>?@[]^_{|}~\n\r\té',
  kanji: '乂ЁЖぞβ皿晒三漢字日本語ΑΒΓψωЮЯабв※〒→←',
  emoji: '😀🎉👍🏽'
}

export interface Random {
  /** number in [0, 1) */
  next (): number
  /** random element (strings: whole code points, so emoji are not split into lone surrogates) */
  pick<T> (values: T[] | string): T | string
  /** random text of at least `length` UTF-16 units, made of runs of characters of each alphabet */
  text (length: number): string
}

/**
 * Seeded PRNG (mulberry32)
 */
export function createRandom (seed: number): Random {
  function next (): number {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  function pick<T> (values: T[] | string): T | string {
    const a = Array.isArray(values) ? values : Array.from(values)
    return a[Math.floor(next() * a.length)]
  }

  function text (length: number): string {
    const classes = Object.keys(ALPHABETS)
    let s = ''
    while (s.length < length) {
      const cls = pick(classes) as string
      const run = 1 + Math.floor(next() * 12)
      for (let i = 0; i < run; i++) s += pick(ALPHABETS[cls])
    }
    return s
  }

  return { next, pick, text }
}

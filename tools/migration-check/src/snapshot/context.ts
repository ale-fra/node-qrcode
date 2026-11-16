import { createRandom } from './random'
import type { LooseModule, PackageUnderTest } from './package-under-test'
import type { Recorder } from './recorder'

/**
 * Inputs shared by several sections
 */
export interface Corpus {
  versions: number[]
  eclNames: string[]
  modeNames: string[]
  /** random texts (mixed alphabets) */
  randomInputs: string[]
  /** error correction level for each random text */
  randomInputLevels: string[]
  /** renderer options */
  renderOptions: Array<Record<string, unknown> | undefined>
}

/**
 * Modules of the package under test used by several sections
 */
export interface Modules {
  QRCode: LooseModule
  Core: LooseModule
  Utils: LooseModule
  Version: LooseModule
  ECLevel: LooseModule
  Mode: LooseModule
  Segments: LooseModule
  toSJIS: LooseModule
}

export interface SnapshotContext {
  pkg: PackageUnderTest
  recorder: Recorder
  corpus: Corpus
  modules: Modules
}

/**
 * Builds the corpus. The random generation order is part of the snapshot format:
 * changing it changes the inputs.
 */
function createCorpus (): Corpus {
  const random = createRandom(42)
  const randomInputs = Array.from({ length: 400 }, () => random.text(1 + Math.floor(random.next() * 120)))
  const randomInputLevels = randomInputs.map(() => random.pick(['L', 'M', 'Q', 'H', 'low', 'high', 'bogus']) as string)

  return {
    versions: Array.from({ length: 40 }, (_, i) => i + 1),
    eclNames: ['L', 'M', 'Q', 'H'],
    modeNames: ['NUMERIC', 'ALPHANUMERIC', 'BYTE', 'KANJI', 'MIXED'],
    randomInputs,
    randomInputLevels,
    renderOptions: [
      undefined, {}, { margin: 0 }, { margin: 1, scale: 1 }, { width: 300 }, { width: 10 },
      { color: { dark: '#00F', light: '#0000' } }, { color: { dark: '#ffffff', light: '#000000' } },
      { errorCorrectionLevel: 'H', version: 7, maskPattern: 2 }, { small: true }, { small: true, inverse: true },
      { rendererOpts: { deflateLevel: 1 } }
    ]
  }
}

export function createContext (pkg: PackageUnderTest, recorder: Recorder): SnapshotContext {
  return {
    pkg,
    recorder,
    corpus: createCorpus(),
    modules: {
      QRCode: pkg.load('lib'),
      Core: pkg.load('lib/core/qrcode'),
      Utils: pkg.load('lib/core/utils'),
      Version: pkg.load('lib/core/version'),
      ECLevel: pkg.load('lib/core/error-correction-level'),
      Mode: pkg.load('lib/core/mode'),
      Segments: pkg.load('lib/core/segments'),
      toSJIS: pkg.load('helper/to-sjis')
    }
  }
}

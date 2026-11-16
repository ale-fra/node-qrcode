/**
 * Core tables and pure functions (exhaustive where feasible)
 */
import { hexOf, sha } from '../hash'
import { ALPHABETS } from '../random'
import { safe } from '../results'
import type { SnapshotContext } from '../context'

const LOOSE_VALUES = [0, 1, 7, 8, -1, '3', '40', '41', '', ' ', 'a', null, undefined, NaN, 2.5, '2.5', true, [], {}]

export function snapshotCore ({ pkg, recorder, corpus, modules }: SnapshotContext): void {
  const { Utils, Version, ECLevel, Mode, toSJIS } = modules
  const { versions, eclNames, modeNames } = corpus
  const record = recorder.record.bind(recorder)

  const GF = pkg.load('lib/core/galois-field')
  record('gf', sha(JSON.stringify({
    exp: Array.from({ length: 512 }, (_, i) => GF.exp(i)),
    log: Array.from({ length: 255 }, (_, i) => GF.log(i + 1)),
    mul: Array.from({ length: 256 * 16 }, (_, i) => GF.mul(i % 256, (i * 7) % 256))
  })))

  const Poly = pkg.load('lib/core/polynomial')
  record('poly', Array.from({ length: 70 }, (_, d) => hexOf(Poly.generateECPolynomial(d))))

  const RS = pkg.load('lib/core/reed-solomon-encoder')
  record('rs', [7, 10, 13, 17, 22, 30, 68].map((deg) => {
    const enc = new RS(deg)
    return hexOf(enc.encode(new Uint8Array(Array.from({ length: 40 }, (_, i) => (i * 37 + deg) & 255))))
  }))
  record('rs-uninit', safe(() => new RS().encode(new Uint8Array([1]))))

  const ECCode = pkg.load('lib/core/error-correction-code')
  record('capacity', versions.map((v) => eclNames.map((e) => modeNames.map((m) => Version.getCapacity(v, ECLevel[e], Mode[m])))))
  record('capacity-default-mode', versions.map((v) => Version.getCapacity(v, ECLevel.M)))
  record('ec', versions.map((v) => eclNames.map((e) => [ECCode.getBlocksCount(v, ECLevel[e]), ECCode.getTotalCodewordsCount(v, ECLevel[e])])))
  record('ec-invalid', [ECCode.getBlocksCount(1, {}), ECCode.getTotalCodewordsCount(1, 'x')])
  record('version-bits', versions.map((v) => safe(() => Version.getEncodedBits(v))))
  record('symbol', versions.map((v) => [Utils.getSymbolSize(v), Utils.getSymbolTotalCodewords(v), Utils.getBCHDigit(v * 1234)]))
  record('symbol-invalid', [0, -1, 41, undefined, null].map((v) => safe(() => Utils.getSymbolSize(v))))
  record('alignment', versions.map((v) => pkg.load('lib/core/alignment-pattern').getPositions(v)))
  record('finder', versions.map((v) => pkg.load('lib/core/finder-pattern').getPositions(v)))
  record('format', eclNames.map((e) => Array.from({ length: 8 }, (_, m) => pkg.load('lib/core/format-info').getEncodedBits(ECLevel[e], m))))

  const MaskPattern = pkg.load('lib/core/mask-pattern')
  record('version-from', LOOSE_VALUES.map((v) => Version.from(v, 'dflt')))
  record('version-check', LOOSE_VALUES.map((v) => pkg.load('lib/core/version-check').isValid(v)))
  record('mask-from', LOOSE_VALUES.map((v) => MaskPattern.from(v)))
  record('mask-valid', LOOSE_VALUES.map((v) => MaskPattern.isValid(v)))
  record('ecl-from', ['l', 'LOW', 'm', 'medium', 'Q', 'quartile', 'h', 'HIGH', 'x', 1, null, undefined, ECLevel.H, { bit: 9 }]
    .map((v) => { const r = ECLevel.from(v, 'dflt'); return r === 'dflt' ? r : r.bit }))
  record('ecl-valid', [ECLevel.L, { bit: 0 }, { bit: 4 }, { bit: -1 }, {}, null, undefined].map((v) => !!ECLevel.isValid(v)))
  record('mode-from', ['numeric', 'ALPHANUMERIC', 'Byte', 'kanji', 'x', 1, null, Mode.BYTE]
    .map((v) => { const r = Mode.from(v, 'dflt'); return r === 'dflt' ? r : r.id }))
  record('mode-valid', [Mode.NUMERIC, Mode.MIXED, {}, null, undefined].map((v) => !!Mode.isValid(v)))
  record('mode-tostring', [Mode.NUMERIC, Mode.KANJI, Mode.MIXED, null].map((v) => safe(() => Mode.toString(v))))
  record('mode-cc', modeNames.slice(0, 4).map((m) => [1, 9, 10, 26, 27, 40].map((v) => Mode.getCharCountIndicator(Mode[m], v))))
  record('mode-cc-invalid', [safe(() => Mode.getCharCountIndicator({}, 1)), safe(() => Mode.getCharCountIndicator(Mode.BYTE, 0))])
  record('mode-best', ['123', 'ABC', 'abc', '漢字', 'A1b', ''].map((s) => Mode.getBestModeForData(s).id))

  const Regex = pkg.load('lib/core/regex')
  record('regex', ['123', 'ABC $%', 'abc', '漢字', '※', 'A1b', '\n'].map((s) => [Regex.testNumeric(s), Regex.testAlphanumeric(s), Regex.testKanji(s)]))
  record('regex-sources', ['KANJI', 'BYTE_KANJI', 'BYTE', 'NUMERIC', 'ALPHANUMERIC'].map((k) => Regex[k].source + '/' + Regex[k].flags))

  const RendererUtils = pkg.load('lib/renderer/utils')
  record('rgba', ['#000', '#fff8', '#12345678', '123456', 'abc', 12345678, '#12', 'zz', null, {}]
    .map((c) => safe(() => RendererUtils.getOptions({ color: { dark: c } }).color.dark)))
  record('render-options', [undefined, {}, { margin: 0 }, { margin: -1 }, { margin: null }, { width: 20 }, { width: 21 }, { width: 200, scale: 9 }, { scale: 0 }, { type: 'svg', rendererOpts: { quality: 0.3 } }]
    .map((o) => RendererUtils.getOptions(o)))
  record('scale', ([[21, { width: 100, margin: 4, scale: 4 }], [21, { width: 10, margin: 4, scale: 3 }], [21, { margin: 0, scale: 2 }]] as Array<[number, object]>)
    .map(([s, o]) => [RendererUtils.getScale(s, o), RendererUtils.getImageWidth(s, o)]))
  record('sjis', Array.from(ALPHABETS.kanji + 'aＡ　・¥').map((c) => toSJIS(c)).concat([toSJIS(''), toSJIS()]))
}

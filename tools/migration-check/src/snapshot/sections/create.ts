/**
 * QRCode.create() over a large corpus, with kanji mode disabled
 * (kanji mode is global and sticky: see kanji.ts, which runs last)
 */
import { qrSummary } from '../qr-summary'
import { safe } from '../results'
import type { SnapshotContext } from '../context'

const FIXED_INPUTS = [
  '0', '1234567', 'HELLO WORLD', 'hello world', 'https://github.com/soldair/node-qrcode',
  'ΑΒΓψωЮЯабв 漢字', '😀 emoji', 'a'.repeat(500), '9'.repeat(3000), 'A'.repeat(1800),
  'Mixed 123456789012345 ABCDEFGHIJ abc 漢字漢字 !!!', '\r\n\t', 'é'.repeat(100),
  // lone surrogates (malformed UTF-16)
  '\ud83d', 'abc\ude00def', '漢\ud800'
]

type CreateCase = [unknown, unknown?]

export function snapshotCreate ({ recorder, corpus, modules }: SnapshotContext): void {
  const { Core, Version, ECLevel, Segments } = modules
  const { randomInputs, randomInputLevels, versions, eclNames } = corpus

  const cases: CreateCase[] = []
  for (const s of FIXED_INPUTS) cases.push([s])
  randomInputs.forEach((s, i) => cases.push([s, { errorCorrectionLevel: randomInputLevels[i] }]))
  for (const v of versions) cases.push(['VERSION ' + v, { version: v }])
  for (let m = 0; m < 8; m++) for (const e of eclNames) cases.push(['mask test 0123', { maskPattern: m, errorCorrectionLevel: e }])
  cases.push(['x', { version: '5', maskPattern: '3' }])
  cases.push(['too long for v1 '.repeat(5), { version: 1 }])
  cases.push(['x'.repeat(3000), { errorCorrectionLevel: 'H' }])
  cases.push([[{ data: 'ABCDEFG', mode: 'alphanumeric' }, { data: 'abcdefg' }, { data: '0123456', mode: 'numeric' }, 'plain string seg', { data: 12345, mode: 'numeric' }]])
  cases.push([[{ data: new Uint8Array([0, 1, 2, 253, 254, 255]), mode: 'byte' }]])
  cases.push([[{ data: Buffer.from('buffer data'), mode: 'byte' }]])
  cases.push([[{ data: 'abc', mode: 'numeric' }]])
  cases.push([[{ data: 'abc', mode: 'invalid-mode' }]])
  cases.push([[{ data: '漢字', mode: 'kanji' }]]) // kanji disabled -> byte
  cases.push([[]])
  cases.push([[{ nodata: 1 }, { data: '' }, { data: 'x' }]])
  cases.push([undefined], [''], [{}], [123], [null])
  recorder.record('create:no-kanji', cases.map(([d, o]) => safe(() => qrSummary(Core.create(d, o)))))

  // random inputs may contain lone surrogates
  recorder.record('segments:no-kanji', randomInputs.slice(0, 100).map((s) => ({
    raw: safe(() => Segments.rawSplit(s).map((x: any) => x.mode.id + ':' + x.getLength())),
    opt: safe(() => Segments.fromString(s, 10).map((x: any) => x.mode.id + ':' + x.getLength()))
  })))

  recorder.record('bestversion', [
    Version.getBestVersionForData([], ECLevel.M),
    Version.getBestVersionForData(Segments.fromArray(['abc']), 'H'),
    Version.getBestVersionForData(Segments.fromArray(['abc'])[0]),
    Version.getBestVersionForData(Segments.fromArray(['a'.repeat(3000)])),
    Version.getBestVersionForData(Segments.fromArray(['a'.repeat(3000), '1'.repeat(10)]))
  ])
}

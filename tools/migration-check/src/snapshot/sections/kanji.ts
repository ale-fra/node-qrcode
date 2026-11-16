/**
 * Kanji mode enabled. The toSJIS function is global and sticky: this section runs last.
 */
import { qrSummary } from '../qr-summary'
import { promiseResult, safe } from '../results'
import type { SnapshotContext } from '../context'

export async function snapshotKanji ({ recorder, corpus, modules }: SnapshotContext): Promise<void> {
  const { QRCode, Core, Utils, Segments, toSJIS } = modules

  const cases: Array<[unknown, unknown?]> = [
    ['漢字'], ['ΑΒΓψωЮЯабв 漢字', { toSJISFunc: toSJIS }], ['皿a晒三', { toSJISFunc: toSJIS }],
    [[{ data: '晒三', mode: 'kanji' }, { data: 'abc' }], { toSJISFunc: toSJIS }],
    [[{ data: 'abc', mode: 'kanji' }], { toSJISFunc: toSJIS }],
    [[{ data: '😀', mode: 'kanji' }], { toSJISFunc: toSJIS }],
    ['x', { toSJISFunc: 'not a function' }]
  ]
  for (const s of corpus.randomInputs.slice(0, 150)) cases.push([s, { toSJISFunc: toSJIS }])

  recorder.record('create:kanji', cases.map(([d, o]) => safe(() => qrSummary(Core.create(d, o)))))
  recorder.record('kanji-enabled', Utils.isKanjiModeEnabled())
  recorder.record('segments:kanji', corpus.randomInputs.slice(0, 100).map((s) => safe(() => Segments.fromString(s, 10).map((x: any) => x.mode.id + ':' + x.getLength()))))
  recorder.record('toString:kanji', await promiseResult(() => QRCode.toString('漢字テスト', { toSJISFunc: toSJIS })))
}

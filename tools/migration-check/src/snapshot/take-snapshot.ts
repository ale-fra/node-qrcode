import { createContext } from './context'
import { PackageUnderTest } from './package-under-test'
import { Recorder } from './recorder'
import { snapshotSurface } from './sections/surface'
import { snapshotCore } from './sections/core'
import { snapshotCreate } from './sections/create'
import { rendererJobs } from './sections/renderers'
import { argumentJobs } from './sections/arguments'
import { runJobs } from './sections/jobs'
import { snapshotFiles } from './sections/files'
import { snapshotBrowser } from './sections/browser'
import { snapshotCli } from './sections/cli'
import { snapshotBundle } from './sections/bundle'
import { snapshotKanji } from './sections/kanji'

/**
 * Takes the snapshot of a package tree (root: folder containing package.json)
 */
export async function takeSnapshot (root: string): Promise<Recorder> {
  const recorder = new Recorder()
  const ctx = createContext(new PackageUnderTest(root), recorder)

  // the order matters: some sections change global state (document, kanji mode)
  snapshotSurface(ctx)
  snapshotCore(ctx)
  snapshotCreate(ctx)
  await runJobs(rendererJobs(ctx).concat(argumentJobs(ctx)), recorder.record.bind(recorder))
  await snapshotFiles(ctx)
  await snapshotBrowser(ctx)
  snapshotCli(ctx)
  snapshotBundle(ctx)
  await snapshotKanji(ctx)

  return recorder
}

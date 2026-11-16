/**
 * Behavioural snapshot of a node-qrcode package tree.
 *
 *   tsx tools/migration-check/src/snapshot.ts <packageRoot> <out.json[.gz]>
 *
 * Records a large, deterministic corpus of outputs (module surfaces, core
 * functions, create(), renderers, files, browser entry, CLI, browser bundles)
 * so that two implementations (original JavaScript vs TypeScript build) can
 * be compared with compare.ts. Big outputs are stored as sha256 hashes.
 */
import * as path from 'path'
import { takeSnapshot } from './snapshot/take-snapshot'
import { writeSnapshot } from './snapshot-file'

async function main (root: string, outFile: string): Promise<void> {
  const recorder = await takeSnapshot(root)
  writeSnapshot(outFile, recorder)
  console.log('snapshot: ' + recorder.size + ' entries -> ' + outFile)
}

const [root, outFile] = process.argv.slice(2)
if (!root || !outFile) {
  console.error('Usage: snapshot <packageRoot> <out.json[.gz]>')
  process.exit(2)
}

main(root, path.resolve(outFile)).catch((e) => {
  console.error(e)
  process.exit(1)
})

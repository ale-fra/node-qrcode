/**
 * Checks the package as it is published and used by consumers:
 *
 *   tsx tools/package-check/src/package-check.ts
 *
 * Packs the package (clean build), installs the tarball in a separate project
 * and checks its contents, its runtime use (CommonJS, ES modules, CLI), its
 * type definitions and its use by bundlers. Exits with code 1 if a check fails.
 */
import * as path from 'path'
import { packPackage } from './pack'
import { createConsumer, removeConsumer } from './consumer'
import { ROOT_DIR } from './paths'
import { Report } from './report'
import { checkContents } from './checks/contents'
import { checkRuntime } from './checks/runtime'
import { checkTypes } from './checks/types'
import { checkBundlers } from './checks/bundlers'

async function main (): Promise<number> {
  const report = new Report()

  console.log('Packing (clean build)...')
  const tarball = packPackage(path.join(ROOT_DIR, '.cache', 'package-check'))
  console.log('Installing ' + path.basename(tarball) + ' in a consumer project...')
  const consumer = createConsumer(tarball)

  try {
    report.section('Contents')
    checkContents(report, consumer.packageDir)
    report.section('Runtime')
    checkRuntime(report, consumer)
    report.section('Types')
    checkTypes(report, consumer)
    report.section('Bundlers')
    await checkBundlers(report, consumer)
  } finally {
    removeConsumer(consumer)
  }

  console.log('\n' + report.results.length + ' checks, ' + report.failed + ' failed')
  return report.failed
}

main().then((failed) => process.exit(failed ? 1 : 0), (e) => {
  console.error(e)
  process.exit(1)
})

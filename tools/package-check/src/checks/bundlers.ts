/**
 * Browser bundles made by consumers: the "browser" field must select the
 * browser entry point (no server code), with working default/named imports
 */
import * as fs from 'fs'
import * as path from 'path'
import * as vm from 'vm'
import * as esbuild from 'esbuild'
import { createCanvas } from '@napi-rs/canvas'
import { execOrThrow } from '../exec'
import { ROOT_DIR } from '../paths'
import type { Consumer } from '../consumer'
import type { Report } from '../report'

interface BundleResult {
  keys: string[]
  sameFunctions: boolean
  svg?: string
}

/**
 * Runs a browser bundle in a VM context and returns window.result
 */
function runBundle (code: string): Promise<BundleResult> {
  const window: { result?: BundleResult } = {}
  const context = vm.createContext({ window, TextEncoder, document: { createElement: () => createCanvas(1, 1) } })
  vm.runInContext(code, context)
  return new Promise((resolve) => setTimeout(() => resolve(window.result as BundleResult), 50))
}

async function checkBundle (code: string, expectedKeys: string[]): Promise<void> {
  if (/pngjs|createWriteStream/.test(code)) throw new Error('The bundle contains server code')

  const result = await runBundle(code)
  if (JSON.stringify(result.keys) !== JSON.stringify(expectedKeys)) {
    throw new Error('Exports: ' + result.keys.join(', ') + ' (expected ' + expectedKeys.join(', ') + ')')
  }
  if (!result.sameFunctions) throw new Error('Default and named exports differ')
  if (result.svg !== '<svg') throw new Error('toString() did not render: ' + result.svg)
}

export async function checkBundlers (report: Report, consumer: Consumer): Promise<void> {
  const checks: Array<[string, () => Promise<void>]> = [
    ['esbuild: import QRCode from \'qrcode\'', async () => {
      const result = await esbuild.build({
        entryPoints: [path.join(consumer.dir, 'bundlers', 'entry-esm.js')],
        absWorkingDir: consumer.dir,
        bundle: true,
        platform: 'browser',
        format: 'iife',
        write: false,
        logLevel: 'silent'
      })
      await checkBundle(result.outputFiles[0].text, ['create', 'toCanvas', 'toDataURL', 'toString'])
    }],
    ['browserify: require(\'qrcode\')', async () => {
      const browserify = path.join(ROOT_DIR, 'node_modules', 'browserify', 'bin', 'cmd.js')
      const out = path.join(consumer.dir, 'bundle-browserify.js')
      execOrThrow(process.execPath, [browserify, 'bundlers/entry-cjs.js', '-o', out], consumer.dir)
      await checkBundle(fs.readFileSync(out, 'utf8'), ['create', 'default', 'toCanvas', 'toDataURL', 'toString'])
    }]
  ]

  for (const [name, fn] of checks) {
    try {
      await fn()
      report.add(name, true)
    } catch (e) {
      report.add(name, false, (e as Error).message)
    }
  }
}

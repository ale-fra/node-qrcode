/**
 * Type definitions, as used by TypeScript consumers:
 * - public API usage compiles with common compiler configurations
 * - invalid usages are rejected
 * - the same usage compiles against @types/qrcode (compatibility)
 * - types of the browser bundles' global
 */
import * as fs from 'fs'
import * as path from 'path'
import { exec } from '../exec'
import { TSC, TYPE_ROOTS } from '../paths'
import type { Consumer } from '../consumer'
import type { Report } from '../report'

/**
 * Type roots with @types/node only: the repository type roots also contain
 * @types/qrcode, which would take precedence for `/// <reference types="qrcode/..." />`
 */
function createTypeRoots (consumer: Consumer): string {
  const typeRoots = path.join(consumer.dir, 'type-roots')
  fs.mkdirSync(typeRoots, { recursive: true })
  fs.symlinkSync(path.join(TYPE_ROOTS, 'node'), path.join(typeRoots, 'node'), 'dir')
  return typeRoots
}

function commonOptions (typeRoots: string): string[] {
  return ['--noEmit', '--strict', '--lib', 'ES2022,DOM', '--types', 'node', '--typeRoots', typeRoots]
}

const CONFIGURATIONS: Array<{ name: string, options: string[], file: string }> = [
  { name: 'module commonjs, esModuleInterop', options: ['--module', 'commonjs', '--moduleResolution', 'node10', '--esModuleInterop', '--ignoreDeprecations', '5.0'], file: 'types/usage.ts' },
  { name: 'module commonjs, no esModuleInterop', options: ['--module', 'commonjs', '--moduleResolution', 'node10', '--ignoreDeprecations', '5.0'], file: 'types/usage.ts' },
  { name: 'module node16', options: ['--module', 'node16', '--moduleResolution', 'node16'], file: 'types/usage.ts' },
  { name: 'module esnext, moduleResolution bundler', options: ['--module', 'esnext', '--moduleResolution', 'bundler'], file: 'types/usage-esm.ts' }
]

function compile (consumer: Consumer, args: string[]): void {
  const result = exec(process.execPath, [TSC].concat(args), consumer.dir)
  if (result.status !== 0) throw new Error((result.stdout + result.stderr).trim().split('\n').slice(0, 10).join('\n'))
}

/**
 * tsconfig which resolves 'qrcode' to @types/qrcode instead of the package
 */
function writeTypesQrcodeConfig (consumer: Consumer, typeRoots: string, file: string, options: Record<string, unknown>): string {
  const typesQrcode = path.join(TYPE_ROOTS, 'qrcode')
  const config = path.join(consumer.dir, 'tsconfig.types-qrcode.' + path.basename(file, '.ts') + '.json')
  fs.writeFileSync(config, JSON.stringify({
    compilerOptions: {
      ...options,
      noEmit: true,
      strict: true,
      lib: ['ES2022', 'DOM'],
      types: ['node'],
      typeRoots: [typeRoots],
      paths: {
        qrcode: [path.join(typesQrcode, 'index.d.ts')],
        'qrcode/helper/to-sjis': [path.join(typesQrcode, 'helper', 'to-sjis.d.ts')]
      }
    },
    files: [file]
  }, null, 2))
  return config
}

export function checkTypes (report: Report, consumer: Consumer): void {
  const typeRoots = createTypeRoots(consumer)
  const COMMON_OPTIONS = commonOptions(typeRoots)

  for (const c of CONFIGURATIONS) {
    report.check('public API compiles (' + c.name + ')', () => compile(consumer, COMMON_OPTIONS.concat(c.options, [c.file])))
  }

  report.check('invalid usages are rejected (@ts-expect-error)', () =>
    compile(consumer, COMMON_OPTIONS.concat(['--module', 'node16', '--moduleResolution', 'node16', 'types/negative.ts'])))

  report.check('browser bundles global types (/// <reference types="qrcode/build/qrcode" />)', () =>
    compile(consumer, COMMON_OPTIONS.concat(['--module', 'node16', '--moduleResolution', 'node16', 'types/globals.ts'])))

  report.check('same usage compiles against @types/qrcode (compatibility of the fixtures)', () => {
    compile(consumer, ['-p', writeTypesQrcodeConfig(consumer, typeRoots, 'types/usage.ts', { module: 'commonjs', moduleResolution: 'node10', esModuleInterop: true, ignoreDeprecations: '5.0' })])
    compile(consumer, ['-p', writeTypesQrcodeConfig(consumer, typeRoots, 'types/usage-esm.ts', { module: 'esnext', moduleResolution: 'bundler' })])
  })
}

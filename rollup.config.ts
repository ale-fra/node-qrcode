/**
 * Browser bundles (build/), built from the compiled library (lib/, helper/):
 * run `pnpm build` (compiles the library first).
 *
 * Loaded through --configPlugin sucrase (see the build:bundle script).
 */
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
// loads the source maps of the compiled TypeScript files (lib/*.js.map),
// so that the bundle source maps point to the original .ts sources
import sourcemaps from 'rollup-plugin-sourcemaps'
import * as fs from 'fs'
import type { Plugin, RollupOptions, RollupWarning, WarningHandler } from 'rollup'

/**
 * Copies a file next to the bundle (eg. type declarations)
 */
function copyFile (from: string, fileName: string): Plugin {
  return {
    name: 'copy-file',
    generateBundle () {
      this.emitFile({ type: 'asset', fileName, source: fs.readFileSync(from) })
    }
  }
}

// only our compiled files have source maps (not virtual modules like '?commonjs-entry')
const sourcemapsConfig = { include: ['lib/**', 'helper/**'], exclude: /\?/ }

const babelConfig = {
  babelrc: false,
  presets: [['@babel/preset-env', { targets: 'defaults, IE >= 10, Safari >= 5.1' }]]
}

const config: RollupOptions[] = [{
  input: 'lib/browser.js',
  output: { file: 'build/qrcode.js', format: 'iife', name: 'QRCode', exports: 'named', sourcemap: true },
  plugins: [sourcemaps(sourcemapsConfig), commonjs(), resolve(), babel(babelConfig), terser(),
    copyFile('src/globals/qrcode.d.ts', 'qrcode.d.ts')]
}, {
  // plain script which adds toSJIS() to the QRCode global (no exports).
  // @rollup/plugin-commonjs gives every CommonJS entry a default export,
  // hence exports: 'auto' and the ignored "missing name" warning
  input: 'helper/to-sjis-browser.js',
  output: { file: 'build/qrcode.tosjis.js', format: 'iife', exports: 'auto', sourcemap: true },
  plugins: [sourcemaps(sourcemapsConfig), commonjs(), resolve(), babel(babelConfig), terser(),
    copyFile('src/globals/qrcode.tosjis.d.ts', 'qrcode.tosjis.d.ts')],
  onwarn (warning: RollupWarning, warn: WarningHandler) {
    if (warning.code === 'MISSING_NAME_OPTION_FOR_IIFE_EXPORT') return
    warn(warning)
  }
}]

export default config

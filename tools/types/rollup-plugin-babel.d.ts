// Minimal declarations for rollup-plugin-babel 4 (no types in the package)
declare module 'rollup-plugin-babel' {
  import type { Plugin } from 'rollup'

  export default function babel (options?: Record<string, unknown>): Plugin
}

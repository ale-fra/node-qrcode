import * as path from 'path'

/** Root of the package (repository checkout) */
export const ROOT_DIR = path.resolve(__dirname, '..', '..', '..')

/** Consumer files used by the checks */
export const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures')

/** Tools of the repository used by the checks */
export const TSC = path.join(ROOT_DIR, 'node_modules', 'typescript', 'bin', 'tsc')
export const TYPE_ROOTS = path.join(ROOT_DIR, 'node_modules', '@types')

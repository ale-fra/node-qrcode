/**
 * Simulates an environment without native Promise support
 * (where the library requires a callback).
 */

const nativePromise = globalThis.Promise

export function removeNativePromise (): void {
  if (globalThis.Promise) {
    Reflect.deleteProperty(globalThis, 'Promise')
  }
}

export function restoreNativePromise (): void {
  if (!globalThis.Promise) {
    globalThis.Promise = nativePromise
  }
}

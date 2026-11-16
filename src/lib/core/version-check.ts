/**
 * Check if QR Code version is valid
 *
 * Accepts any value: numeric strings (eg. '5') are valid versions
 *
 * @param  version QR Code version
 * @return         true if valid version, false otherwise
 */
export function isValid (version: unknown): boolean {
  // isNaN() coerces its argument: keep the coercion for non-number inputs
  return !isNaN(version as number) && (version as number) >= 1 && (version as number) <= 40
}

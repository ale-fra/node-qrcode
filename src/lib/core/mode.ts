import * as VersionCheck from './version-check'
import * as Regex from './regex'

export type ModeId = 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'

/**
 * Data encoding mode
 */
export interface Mode<TModeId extends ModeId = ModeId> {
  id: TModeId
  bit: number
  ccBits: readonly number[]
}

/**
 * Pseudo-mode used to compute the capacity of mixed-mode data
 */
export interface MixedMode {
  id?: undefined
  bit: -1
  ccBits?: undefined
}

/**
 * Numeric mode encodes data from the decimal digit set (0 - 9)
 * (byte values 30HEX to 39HEX).
 * Normally, 3 data characters are represented by 10 bits.
 */
export const NUMERIC: Mode<'Numeric'> = {
  id: 'Numeric',
  bit: 1 << 0,
  ccBits: [10, 12, 14]
}

/**
 * Alphanumeric mode encodes data from a set of 45 characters,
 * i.e. 10 numeric digits (0 - 9),
 *      26 alphabetic characters (A - Z),
 *   and 9 symbols (SP, $, %, *, +, -, ., /, :).
 * Normally, two input characters are represented by 11 bits.
 */
export const ALPHANUMERIC: Mode<'Alphanumeric'> = {
  id: 'Alphanumeric',
  bit: 1 << 1,
  ccBits: [9, 11, 13]
}

/**
 * In byte mode, data is encoded at 8 bits per character.
 */
export const BYTE: Mode<'Byte'> = {
  id: 'Byte',
  bit: 1 << 2,
  ccBits: [8, 16, 16]
}

/**
 * The Kanji mode efficiently encodes Kanji characters in accordance with
 * the Shift JIS system based on JIS X 0208.
 * The Shift JIS values are shifted from the JIS X 0208 values.
 * JIS X 0208 gives details of the shift coded representation.
 * Each two-byte character value is compacted to a 13-bit binary codeword.
 */
export const KANJI: Mode<'Kanji'> = {
  id: 'Kanji',
  bit: 1 << 3,
  ccBits: [8, 10, 12]
}

/**
 * Mixed mode will contain a sequences of data in a combination of any of
 * the modes described above
 */
export const MIXED: MixedMode = {
  bit: -1
}

/**
 * Returns the number of bits needed to store the data length
 * according to QR Code specifications.
 *
 * @param  mode    Data mode
 * @param  version QR Code version
 * @return         Number of bits
 */
export function getCharCountIndicator (mode: Mode | MixedMode, version: number): number {
  if (!mode.ccBits) throw new Error('Invalid mode: ' + mode)

  if (!VersionCheck.isValid(version)) {
    throw new Error('Invalid version: ' + version)
  }

  if (version >= 1 && version < 10) return mode.ccBits[0]
  else if (version < 27) return mode.ccBits[1]
  return mode.ccBits[2]
}

/**
 * Returns the most efficient mode to store the specified data
 *
 * @param  dataStr Input data string
 * @return         Best mode
 */
export function getBestModeForData (dataStr: string): Mode {
  if (Regex.testNumeric(dataStr)) return NUMERIC
  else if (Regex.testAlphanumeric(dataStr)) return ALPHANUMERIC
  else if (Regex.testKanji(dataStr)) return KANJI
  else return BYTE
}

/**
 * Return mode name as string
 *
 * @param  mode Mode object
 * @return      Mode name
 */
export function toString (mode: Mode | MixedMode | null | undefined): ModeId {
  if (mode && mode.id) return mode.id
  throw new Error('Invalid mode')
}

/**
 * Check if input param is a valid mode object
 *
 * Returns a truthy value (not necessarily true) if valid
 *
 * @param  mode Mode object
 * @return      True if valid mode, false otherwise
 */
export function isValid (mode: unknown): mode is Mode {
  const m = mode as Partial<Mode> | null | undefined
  return (m && m.bit && m.ccBits) as unknown as boolean
}

/**
 * Get mode object from its name
 *
 * @param  string Mode name
 * @return        Mode object
 */
function fromString (string: unknown): Mode {
  if (typeof string !== 'string') {
    throw new Error('Param is not a string')
  }

  const lcStr = string.toLowerCase()

  switch (lcStr) {
    case 'numeric':
      return NUMERIC
    case 'alphanumeric':
      return ALPHANUMERIC
    case 'kanji':
      return KANJI
    case 'byte':
      return BYTE
    default:
      throw new Error('Unknown mode: ' + string)
  }
}

/**
 * Returns mode from a value.
 * If value is not a valid mode, returns defaultValue
 *
 * @param  value        Encoding mode
 * @param  defaultValue Fallback value
 * @return              Encoding mode
 */
export function from (value: unknown): Mode | undefined
export function from<T> (value: unknown, defaultValue: T): Mode | T
export function from<T> (value: unknown, defaultValue?: T): Mode | T | undefined {
  if (isValid(value)) {
    return value
  }

  try {
    return fromString(value)
  } catch (e) {
    return defaultValue
  }
}

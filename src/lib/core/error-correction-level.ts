export interface ErrorCorrectionLevel {
  bit: 0 | 1 | 2 | 3
}

export const L: ErrorCorrectionLevel = { bit: 1 }
export const M: ErrorCorrectionLevel = { bit: 0 }
export const Q: ErrorCorrectionLevel = { bit: 3 }
export const H: ErrorCorrectionLevel = { bit: 2 }

function fromString (string: unknown): ErrorCorrectionLevel {
  if (typeof string !== 'string') {
    throw new Error('Param is not a string')
  }

  const lcStr = string.toLowerCase()

  switch (lcStr) {
    case 'l':
    case 'low':
      return L

    case 'm':
    case 'medium':
      return M

    case 'q':
    case 'quartile':
      return Q

    case 'h':
    case 'high':
      return H

    default:
      throw new Error('Unknown EC Level: ' + string)
  }
}

export function isValid (level: unknown): level is ErrorCorrectionLevel {
  const l = level as { bit?: number } | null | undefined
  // returns a falsy value (not necessarily false) for invalid levels
  return (l && typeof l.bit !== 'undefined' &&
    l.bit >= 0 && l.bit < 4) as boolean
}

/**
 * Returns error correction level from a value (level object or name, eg. 'L', 'low').
 * If value is not valid, returns defaultValue
 */
export function from (value: unknown): ErrorCorrectionLevel | undefined
export function from (value: unknown, defaultValue: ErrorCorrectionLevel): ErrorCorrectionLevel
export function from<T> (value: unknown, defaultValue: T): ErrorCorrectionLevel | T
export function from<T> (value: unknown, defaultValue?: T): ErrorCorrectionLevel | T | undefined {
  if (isValid(value)) {
    return value
  }

  try {
    return fromString(value)
  } catch (e) {
    return defaultValue
  }
}

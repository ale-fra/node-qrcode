/**
 * QR Code symbol
 */
import BitMatrix = require('../core/bit-matrix')
import type { ErrorCorrectionLevel } from '../core/error-correction-level'
import type { QRCodeMaskPattern } from './options'
import type { GeneratedQRCodeSegment } from './segments'

/**
 * QR Code symbol, as returned by create()
 */
export interface QRCode {
  /**
   * BitMatrix class with modules data
   */
  modules: BitMatrix
  /**
   * Calculated QR Code version
   */
  version: number
  /**
   * Error Correction Level
   */
  errorCorrectionLevel: ErrorCorrectionLevel
  /**
   * Calculated Mask pattern
   */
  maskPattern: QRCodeMaskPattern
  /**
   * Generated segments
   */
  segments: GeneratedQRCodeSegment[]
}

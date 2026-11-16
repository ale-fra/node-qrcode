/**
 * Options of the public API
 */
import type { ErrorCorrectionLevel } from '../core/error-correction-level'

export type QRCodeErrorCorrectionLevel = 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H'
export type QRCodeMaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
/**
 * Converts a kanji character to its Shift JIS value
 * (undefined if the character is not supported)
 */
export type QRCodeToSJISFunc = (codePoint: string) => number | undefined

export interface QRCodeOptions {
  /**
   * QR Code version. If not specified the more suitable value will be calculated.
   */
  version?: number | undefined
  /**
   * Error correction level (name, or level object as returned in QRCode.errorCorrectionLevel).
   * @default 'M'
   */
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel | ErrorCorrectionLevel | undefined
  /**
   * Mask pattern used to mask the symbol.
   *
   * If not specified the more suitable value will be calculated.
   */
  maskPattern?: QRCodeMaskPattern | undefined
  /**
   * Helper function used internally to convert a kanji to its Shift JIS value.
   * Provide this function if you need support for Kanji mode.
   */
  toSJISFunc?: QRCodeToSJISFunc | undefined
}

export interface QRCodeRenderersOptions extends QRCodeOptions {
  /**
   * Define how much wide the quiet zone should be.
   * @default 4
   */
  margin?: number | undefined
  /**
   * Scale factor. A value of `1` means 1px per modules (black dots).
   * @default 4
   */
  scale?: number | undefined
  /**
   * Forces a specific width for the output image.
   * If width is too small to contain the qr symbol, this option will be ignored.
   * Takes precedence over `scale`.
   */
  width?: number | undefined
  color?: {
    /**
     * Color of dark module. Value must be in hex format (RGBA).
     * Note: dark color should always be darker than `color.light`.
     * @default '#000000ff'
     */
    dark?: string | undefined
    /**
     * Color of light module. Value must be in hex format (RGBA).
     * @default '#ffffffff'
     */
    light?: string | undefined
  } | undefined
}

export interface QRCodePngRendererOptions {
  /**
   * Compression level for deflate.
   * @default 9
   */
  deflateLevel?: number | undefined
  /**
   * Compression strategy for deflate.
   * @default 3
   */
  deflateStrategy?: number | undefined
}

export type QRCodeDataURLType = 'image/png' | 'image/jpeg' | 'image/webp'
export type QRCodeToDataURLOptions = QRCodeToDataURLOptionsJpegWebp | QRCodeToDataURLOptionsOther
export interface QRCodeToDataURLOptionsJpegWebp extends QRCodeRenderersOptions {
  /**
   * Data URI format (image/jpeg and image/webp: browser only).
   * @default 'image/png'
   */
  type: 'image/jpeg' | 'image/webp'
  rendererOpts?: {
    /**
     * A number between `0` and `1` indicating image quality.
     * @default 0.92
     */
    quality?: number | undefined
  } | undefined
}
export interface QRCodeToDataURLOptionsOther extends QRCodeRenderersOptions {
  /**
   * Data URI format.
   * @default 'image/png'
   */
  type?: Exclude<QRCodeDataURLType, 'image/jpeg' | 'image/webp'> | undefined
  rendererOpts?: QRCodePngRendererOptions | undefined
}

export type QRCodeStringType = 'utf8' | 'svg' | 'terminal'
export type QRCodeToStringOptions = QRCodeToStringOptionsTerminal | QRCodeToStringOptionsOther
export interface QRCodeToStringOptionsTerminal extends QRCodeRenderersOptions {
  /**
   * Output format.
   * @default 'utf8'
   */
  type: 'terminal'
  /**
   * Outputs smaller QR code.
   * @default false
   */
  small?: boolean | undefined
  /**
   * Inverts colors (small output only).
   * @default false
   */
  inverse?: boolean | undefined
}
export interface QRCodeToStringOptionsOther extends QRCodeRenderersOptions {
  /**
   * Output format.
   * @default 'utf8'
   */
  type?: Exclude<QRCodeStringType, 'terminal'> | undefined
}

export type QRCodeFileType = 'png' | 'svg' | 'utf8'
export type QRCodeToFileOptions = QRCodeToFileOptionsPng | QRCodeToFileOptionsOther
export interface QRCodeToFileOptionsPng extends QRCodeRenderersOptions {
  /**
   * Output format.
   * @default 'png'
   */
  type?: 'png' | undefined
  rendererOpts?: QRCodePngRendererOptions | undefined
}
export interface QRCodeToFileOptionsOther extends QRCodeRenderersOptions {
  /**
   * Output format.
   * @default 'png'
   */
  type: Exclude<QRCodeFileType, 'png'> | undefined
}

export type QRCodeFileStreamType = 'png' | 'image/png'
export interface QRCodeToFileStreamOptions extends QRCodeRenderersOptions {
  /**
   * Output format. Only png supported for file stream.
   */
  type?: QRCodeFileStreamType | undefined
  rendererOpts?: QRCodePngRendererOptions | undefined
}

export type QRCodeBufferType = 'png' | 'image/png'
export interface QRCodeToBufferOptions extends QRCodeRenderersOptions {
  /**
   * Output format. Only png supported for Buffer.
   */
  type?: QRCodeBufferType | undefined
  rendererOpts?: QRCodePngRendererOptions | undefined
}

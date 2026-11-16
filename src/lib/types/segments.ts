/**
 * Input data (text and segments) and generated data segments
 */
import BitBuffer = require('../core/bit-buffer')
import NumericData = require('../core/numeric-data')
import AlphanumericData = require('../core/alphanumeric-data')
import ByteData = require('../core/byte-data')
import KanjiData = require('../core/kanji-data')
import type { Mode } from '../core/mode'

export type QRCodeSegmentMode = 'alphanumeric' | 'numeric' | 'byte' | 'kanji'
export type QRCodeSegment =
  | QRCodeNumericSegment
  | QRCodeAlphanumericSegment
  | QRCodeByteSegment
  | QRCodeKanjiSegment
  | {
    mode?: never
    data: string | QRCodeBytes
  }

/**
 * Binary data (values are clamped to 0-255), eg. [253, 254, 255], Buffer, Uint8Array
 */
export type QRCodeBytes = ArrayLike<number>

export interface QRCodeNumericSegment {
  mode: 'numeric'
  data: string | number
}

export interface QRCodeAlphanumericSegment {
  mode: 'alphanumeric'
  data: string
}

export interface QRCodeByteSegment {
  mode: 'byte'
  /** Strings are encoded as UTF-8 */
  data: string | QRCodeBytes
}

export interface QRCodeKanjiSegment {
  mode: 'kanji'
  data: string
}

/**
 * Data accepted as input: a string or a list of segments
 * (strings or objects describing a segment)
 */
export type QRCodeInput = string | ReadonlyArray<string | QRCodeSegment>

/**
 * Interface shared by all the data segments
 */
export interface DataSegment {
  getLength(): number
  getBitsLength(): number
}

/**
 * Segment generated from input data
 */
export type GeneratedQRCodeSegment = NumericData | AlphanumericData | ByteData | KanjiData

/**
 * Internal representation of any data segment
 */
export interface EncodableSegment extends DataSegment {
  mode: Mode
  write(bitBuffer: BitBuffer): void
}

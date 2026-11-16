/**
 * Public types.
 *
 * Names and shapes follow the community typings (@types/qrcode) so that code
 * written against them keeps compiling.
 */
import BitMatrix = require('../core/bit-matrix')
import NumericData = require('../core/numeric-data')
import AlphanumericData = require('../core/alphanumeric-data')
import ByteData = require('../core/byte-data')
import KanjiData = require('../core/kanji-data')
import type { ErrorCorrectionLevel } from '../core/error-correction-level'
import type { Mode, ModeId } from '../core/mode'

export type { BitMatrix, NumericData, AlphanumericData, ByteData, KanjiData, ErrorCorrectionLevel, Mode, ModeId }
export type * from './options'
export type * from './segments'
export type * from './qrcode'
export type * from './callbacks'

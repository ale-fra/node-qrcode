import { hexOf, sha } from './hash'
import type { LooseModule } from './package-under-test'

/**
 * Compact, comparable description of a QR code symbol
 */
export function qrSummary (qr: LooseModule): unknown {
  return {
    version: qr.version,
    ecl: qr.errorCorrectionLevel,
    mask: qr.maskPattern,
    size: qr.modules.size,
    modules: sha(Buffer.from(qr.modules.data)),
    reserved: sha(Buffer.from(qr.modules.reservedBit)),
    segments: qr.segments.map((s: LooseModule) => ({
      mode: s.mode.id,
      len: s.getLength(),
      bits: s.getBitsLength(),
      data: typeof s.data === 'string' ? s.data : hexOf(s.data)
    }))
  }
}

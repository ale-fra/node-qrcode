import * as Mode from './mode'
import BitBuffer = require('./bit-buffer')

class ByteData {
  mode: Mode.Mode<'Byte'>
  data: Uint8Array

  /**
   * @param data String (encoded as UTF-8) or bytes
   */
  constructor (data: string | ArrayLike<number> | ArrayBufferLike) {
    this.mode = Mode.BYTE
    if (typeof (data) === 'string') {
      this.data = new TextEncoder().encode(data)
    } else {
      this.data = new Uint8Array(data as ArrayLike<number>)
    }
  }

  static getBitsLength (length: number): number {
    return length * 8
  }

  getLength (): number {
    return this.data.length
  }

  getBitsLength (): number {
    return ByteData.getBitsLength(this.data.length)
  }

  write (bitBuffer: BitBuffer): void {
    for (let i = 0, l = this.data.length; i < l; i++) {
      bitBuffer.put(this.data[i], 8)
    }
  }
}

export = ByteData

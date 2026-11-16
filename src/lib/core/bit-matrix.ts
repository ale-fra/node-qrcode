/**
 * Helper class to handle QR Code symbol modules
 */
class BitMatrix {
  /** Symbol size */
  size: number
  /** Modules: 1 = dark, 0 = light */
  data: Uint8Array
  /** 1 = reserved module (not affected by masking) */
  reservedBit: Uint8Array

  /**
   * @param size Symbol size
   */
  constructor (size: number) {
    if (!size || size < 1) {
      throw new Error('BitMatrix size must be defined and greater than 0')
    }

    this.size = size
    this.data = new Uint8Array(size * size)
    this.reservedBit = new Uint8Array(size * size)
  }

  /**
   * Set bit value at specified location
   * If reserved flag is set, this bit will be ignored during masking process
   */
  set (row: number, col: number, value: boolean | number, reserved?: boolean): void {
    const index = row * this.size + col
    // typed arrays store values with ToNumber (true -> 1, false -> 0)
    this.data[index] = value as number
    if (reserved) this.reservedBit[index] = 1
  }

  /**
   * Returns bit value at specified location
   */
  get (row: number, col: number): number {
    return this.data[row * this.size + col]
  }

  /**
   * Applies xor operator at specified location
   * (used during masking process)
   */
  xor (row: number, col: number, value: boolean | number): void {
    this.data[row * this.size + col] ^= value as number
  }

  /**
   * Check if bit at specified location is reserved
   *
   * @return 1 if reserved, 0 otherwise
   */
  isReserved (row: number, col: number): number {
    return this.reservedBit[row * this.size + col]
  }
}

export = BitMatrix

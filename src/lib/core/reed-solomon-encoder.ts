import * as Polynomial from './polynomial'

class ReedSolomonEncoder {
  genPoly: Uint8Array | undefined
  degree: number | undefined

  constructor (degree?: number) {
    this.genPoly = undefined
    this.degree = degree

    if (this.degree) this.initialize(this.degree)
  }

  /**
   * Initialize the encoder.
   * The input param should correspond to the number of error correction codewords.
   */
  initialize (degree: number): void {
    // create an irreducible generator polynomial
    this.degree = degree
    this.genPoly = Polynomial.generateECPolynomial(this.degree)
  }

  /**
   * Encodes a chunk of data
   *
   * @param  data Buffer containing input data
   * @return      Buffer containing encoded data
   */
  encode (data: ArrayLike<number>): Uint8Array {
    if (!this.genPoly) {
      throw new Error('Encoder not initialized')
    }

    // genPoly is only set by initialize(), together with degree
    const degree = this.degree as number

    // Calculate EC for this data block
    // extends data size to data+genPoly size
    const paddedData = new Uint8Array(data.length + degree)
    paddedData.set(data)

    // The error correction codewords are the remainder after dividing the data codewords
    // by a generator polynomial
    const remainder = Polynomial.mod(paddedData, this.genPoly)

    // return EC data blocks (last n byte, where n is the degree of genPoly)
    // If coefficients number in remainder are less than genPoly degree,
    // pad with 0s to the left to reach the needed number of coefficients
    const start = degree - remainder.length
    if (start > 0) {
      const buff = new Uint8Array(degree)
      buff.set(remainder, start)

      return buff
    }

    return remainder
  }
}

export = ReedSolomonEncoder

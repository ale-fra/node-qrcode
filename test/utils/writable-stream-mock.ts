import { Writable } from 'stream'

/**
 * Writable stream which discards the data and emits 'close' when finished.
 *
 * When forced to fail (forceErrorOnWrite()), each write emits an 'error' event
 * and also fails through the write callback: an 'error' event is emitted twice.
 */
export class WritableStreamMock extends Writable {
  private forceError = false

  constructor () {
    super()

    this.once('finish', () => {
      this.close()
    })
  }

  _write (_chunk: unknown, _encoding: BufferEncoding, cb: (error?: Error | null) => void): void {
    if (this.forceError) this.emit('error', new Error('Fake error'))
    // a non-Error value (true) is passed on purpose, as in the original mock
    cb((this.forceError || null) as Error | null)
  }

  close (cb?: () => void): void {
    this.emit('close')
    if (cb) cb()
  }

  forceErrorOnWrite (): this {
    this.forceError = true
    return this
  }
}

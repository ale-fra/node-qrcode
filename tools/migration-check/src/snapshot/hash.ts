import * as crypto from 'crypto'

export function sha (data: string | Uint8Array): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function hexOf (data: ArrayLike<number>): string {
  return Buffer.from(data as Uint8Array).toString('hex')
}

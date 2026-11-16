/**
 * Collects the snapshot entries (each key must be unique)
 */
export class Recorder {
  private readonly entries: Record<string, unknown> = {}

  record (key: string, value: unknown): void {
    if (key in this.entries) throw new Error('duplicate key ' + key)
    this.entries[key] = value
  }

  get size (): number {
    return Object.keys(this.entries).length
  }

  toJSON (): Record<string, unknown> {
    return this.entries
  }
}

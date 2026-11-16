import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'

/**
 * Snapshot files are JSON, optionally gzipped (.gz)
 */
export function readSnapshot (file: string): Record<string, unknown> {
  const data = fs.readFileSync(file)
  return JSON.parse((file.endsWith('.gz') ? zlib.gunzipSync(data) : data).toString('utf8'))
}

export function writeSnapshot (file: string, snapshot: unknown): void {
  const json = JSON.stringify(snapshot, null, 1)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, file.endsWith('.gz') ? zlib.gzipSync(json, { level: 9 }) : json)
}

/**
 * Asynchronous snapshot entry: [key, function computing the value]
 */
export type Job = [string, () => Promise<unknown>]

export async function runJobs (jobs: Job[], record: (key: string, value: unknown) => void): Promise<void> {
  for (const [key, fn] of jobs) record(key, await fn())
}

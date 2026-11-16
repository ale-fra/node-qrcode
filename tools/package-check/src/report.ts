/**
 * Results of the checks
 */
export interface CheckResult {
  name: string
  ok: boolean
  details?: string
}

export class Report {
  readonly results: CheckResult[] = []

  add (name: string, ok: boolean, details?: string): void {
    this.results.push({ name, ok, details })
    console.log((ok ? '  ok   ' : '  FAIL ') + name + (details && !ok ? '\n         ' + details.split('\n').join('\n         ') : ''))
  }

  /**
   * Runs a check: it fails if it throws (the error message is reported)
   */
  check (name: string, fn: () => void): void {
    try {
      fn()
      this.add(name, true)
    } catch (e) {
      this.add(name, false, (e as Error).message)
    }
  }

  section (title: string): void {
    console.log('\n' + title)
  }

  get failed (): number {
    return this.results.filter((r) => !r.ok).length
  }
}

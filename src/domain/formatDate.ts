export function formatGameDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "YYYY-MM-DD" in the viewer's local timezone, for seeding a date input's default value. */
export function todayDateInputValue(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

/** Inverse of the browser's date-input value ("YYYY-MM-DD") — parsed as local midnight, not UTC. */
export function dateInputValueToEpoch(value: string): number {
  return new Date(`${value}T00:00:00`).getTime()
}

import type { StatEvent } from '../db/types'

/**
 * The game's current quarter is derived from `quarter_end` events rather than
 * stored on Game — one fewer place for game state to drift out of sync with
 * the event log, and undoing an end-quarter event naturally reverts it.
 */
export function currentQuarter(events: StatEvent[]): number {
  const endedQuarters = events.filter((e) => e.type === 'quarter_end').length
  return endedQuarters + 1
}

export function quarterLabel(quarter: number): string {
  return quarter <= 4 ? `Q${quarter}` : `OT${quarter - 4}`
}

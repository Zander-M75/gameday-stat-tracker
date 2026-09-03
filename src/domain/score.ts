import type { StatEvent } from '../db/types'

export interface Score {
  us: number
  opponent: number
}

/** `goal` and `goal_against` events are the only score-bearing events — always derived, never stored. */
export function computeScore(events: StatEvent[]): Score {
  let us = 0
  let opponent = 0
  for (const event of events) {
    if (event.type === 'goal') us++
    if (event.type === 'goal_against') opponent++
  }
  return { us, opponent }
}

import { db } from './db'
import type { Player, StatEvent } from './types'

/**
 * `isActive`/`deleted` aren't indexed (see db.ts) — these helpers do the
 * indexed lookup then filter in JS so call sites don't have to know that.
 */

export function activePlayersForTeam(teamId: string): Promise<Player[]> {
  return db.players
    .where('teamId')
    .equals(teamId)
    .filter((p) => p.isActive)
    .toArray()
}

export function liveEventsForGame(gameId: string): Promise<StatEvent[]> {
  return db.statEvents
    .where('gameId')
    .equals(gameId)
    .filter((e) => !e.deleted)
    .sortBy('timestamp')
}

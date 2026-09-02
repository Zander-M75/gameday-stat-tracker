import Dexie, { type Table } from 'dexie'
import type { Game, Player, StatEvent, SyncQueueItem, Team } from './types'

export class GamedayDatabase extends Dexie {
  teams!: Table<Team, string>
  players!: Table<Player, string>
  games!: Table<Game, string>
  statEvents!: Table<StatEvent, string>
  syncQueue!: Table<SyncQueueItem, string>

  constructor() {
    super('gameday-stat-tracker')

    // Note: `isActive` and `deleted` are deliberately NOT indexed — IndexedDB
    // can't index booleans (it's not a valid key type), and silently drops any
    // record from the index whose keyPath evaluates to one instead of erroring.
    // A [teamId+isActive] style compound index on a boolean field just returns
    // nothing, silently. Filter for those in JS after an indexed lookup instead;
    // roster and per-game event counts are small enough that this is free.
    this.version(1).stores({
      teams: 'id, name',
      players: 'id, teamId, jerseyNumber',
      games: 'id, teamId, status, date',
      // [gameId+timestamp] serves the live event feed and undo (most recent for this game, in order).
      statEvents: 'id, gameId, playerId, type, quarter, timestamp, [gameId+timestamp]',
      syncQueue: 'id, entityType, entityId, syncedAt',
    })
  }
}

export const db = new GamedayDatabase()

/**
 * Core data model.
 *
 * The event log (StatEvent) is the source of truth for everything that happens
 * in a game. Box scores, score, and every derived stat are computed from it at
 * read time in later phases — never stored redundantly. That's what keeps undo
 * (delete the most recent event) and sync (append-only, idempotent by id)
 * simple instead of needing to reconcile mutable aggregate counters.
 */

export type Position = 'Attack' | 'Midfield' | 'Defense' | 'LSM' | 'FOGO' | 'Goalie'

export interface Team {
  id: string
  name: string
  createdAt: number
}

export interface Player {
  id: string
  teamId: string
  jerseyNumber: number
  firstName: string
  lastName: string
  position: Position
  /** false = archived. Archived players are hidden from live stat entry and new game rosters. */
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export type GameStatus = 'in_progress' | 'final'

export interface Game {
  id: string
  teamId: string
  /**
   * The opponent is never rostered — team-level stats and goals-against on our
   * goalie are enough to reconstruct the opponent side of the box score.
   */
  opponentName: string
  /** Epoch ms. */
  date: number
  isHome: boolean
  /** Player ids dressed for this specific game — a subset of the team roster. */
  dressedPlayerIds: string[]
  status: GameStatus
  createdAt: number
  updatedAt: number
}

/**
 * Event types attributed to a single player. Note what's *not* a separate
 * event: a goal counts as both a shot and a shot-on-goal, and a save implies
 * the opposing shot was on goal. Those relationships are derivation rules for
 * the box score (phase 5), not additional events to record here — recording
 * one event per real-world action is what keeps live entry to one tap.
 */
export type PlayerEventType =
  | 'goal'
  | 'assist'
  | 'shot'
  | 'shot_on_goal'
  | 'save'
  | 'goal_against'
  | 'ground_ball'
  | 'faceoff_win'
  | 'faceoff_loss'
  | 'turnover'
  | 'caused_turnover'

/** Team-level events with no individual attribution. */
export type TeamEventType = 'clear_attempt' | 'clear_success' | 'quarter_end'

export type StatEventType = PlayerEventType | 'penalty' | TeamEventType

export type PenaltyDurationSeconds = 30 | 60 | 180

interface StatEventBase {
  /** Client-generated uuid — makes sync upserts idempotent (phase 8). */
  id: string
  gameId: string
  quarter: number
  /** Clock reading at the moment of entry, e.g. "8:42". Not required to record an event. */
  gameClock: string | null
  /** Epoch ms, client clock. */
  timestamp: number
  /** Links an assist to its goal, or any future paired events. Null otherwise. */
  relatedEventId: string | null
  /** Soft-delete: undo and manual delete both flip this rather than removing the row. */
  deleted: boolean
}

export type StatEvent =
  | (StatEventBase & { type: PlayerEventType; playerId: string })
  | (StatEventBase & {
      type: 'penalty'
      playerId: string
      penaltyDurationSeconds: PenaltyDurationSeconds
      /** Releasable penalties end early if the opponent scores; non-releasable run the full duration. */
      penaltyReleasable: boolean
    })
  | (StatEventBase & { type: TeamEventType; playerId: null })

export type SyncEntityType = 'team' | 'player' | 'game' | 'statEvent'
export type SyncOperation = 'upsert' | 'delete'

/**
 * One row per pending change. Sync (phase 8) looks up the current record by
 * (entityType, entityId) at flush time rather than snapshotting a payload here,
 * so a record queued twice before it ever syncs just flushes its latest state.
 */
export interface SyncQueueItem {
  id: string
  entityType: SyncEntityType
  entityId: string
  operation: SyncOperation
  enqueuedAt: number
  syncedAt: number | null
  attempts: number
  lastError: string | null
}

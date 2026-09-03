import { db } from './db'
import { createId } from './id'
import { enqueueSync } from '../sync/queue'
import type {
  Game,
  GameStatus,
  PenaltyDurationSeconds,
  Player,
  PlayerEventType,
  Position,
  StatEvent,
  Team,
  TeamEventType,
} from './types'

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

export function allPlayersForTeam(teamId: string): Promise<Player[]> {
  return db.players.where('teamId').equals(teamId).sortBy('jerseyNumber')
}

export function liveEventsForGame(gameId: string): Promise<StatEvent[]> {
  return db.statEvents
    .where('gameId')
    .equals(gameId)
    .filter((e) => !e.deleted)
    .sortBy('timestamp')
}

let ensureTeamPromise: Promise<Team> | null = null

/**
 * This is a single-coach, single-team app for now — Team exists mainly to
 * shape the future multi-coach Supabase schema (phase 7) — so lazily create
 * the one team record instead of making the coach name it before they can
 * add players. The in-flight promise is cached so concurrent callers (e.g.
 * React StrictMode's double-invoke in dev) can't race and create two.
 */
export function getOrCreateTeam(): Promise<Team> {
  if (!ensureTeamPromise) {
    ensureTeamPromise = (async () => {
      const existing = await db.teams.toCollection().first()
      if (existing) return existing
      const team: Team = { id: createId(), name: 'My Team', createdAt: Date.now() }
      await db.teams.add(team)
      await enqueueSync('team', team.id)
      return team
    })().catch((error: unknown) => {
      // A failed attempt shouldn't permanently poison this cache for the
      // rest of the session — clear it so the next caller gets a fresh try
      // instead of the same rejected promise forever.
      ensureTeamPromise = null
      throw error
    })
  }
  return ensureTeamPromise
}

export interface NewPlayerInput {
  jerseyNumber: number
  firstName: string
  lastName: string
  position: Position
}

export async function addPlayer(teamId: string, input: NewPlayerInput): Promise<Player> {
  const now = Date.now()
  const player: Player = {
    id: createId(),
    teamId,
    ...input,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
  await db.players.add(player)
  await enqueueSync('player', player.id)
  return player
}

export async function updatePlayer(id: string, changes: Partial<NewPlayerInput>): Promise<void> {
  await db.players.update(id, { ...changes, updatedAt: Date.now() })
  await enqueueSync('player', id)
}

export async function setPlayerActive(id: string, isActive: boolean): Promise<void> {
  await db.players.update(id, { isActive, updatedAt: Date.now() })
  await enqueueSync('player', id)
}

export async function bulkAddPlayers(teamId: string, inputs: NewPlayerInput[]): Promise<void> {
  const now = Date.now()
  const players: Player[] = inputs.map((input) => ({
    id: createId(),
    teamId,
    ...input,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }))
  await db.players.bulkAdd(players)
  await Promise.all(players.map((player) => enqueueSync('player', player.id)))
}

/** Most recent first — the natural order for both the in-progress and past-games lists. */
export async function gamesForTeam(teamId: string): Promise<Game[]> {
  const games = await db.games.where('teamId').equals(teamId).sortBy('date')
  return games.reverse()
}

export function getGame(id: string): Promise<Game | undefined> {
  return db.games.get(id)
}

export interface NewGameInput {
  opponentName: string
  date: number
  isHome: boolean
  dressedPlayerIds: string[]
}

export async function createGame(teamId: string, input: NewGameInput): Promise<Game> {
  const now = Date.now()
  const game: Game = {
    id: createId(),
    teamId,
    ...input,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  }
  await db.games.add(game)
  await enqueueSync('game', game.id)
  return game
}

export async function setGameStatus(id: string, status: GameStatus): Promise<void> {
  await db.games.update(id, { status, updatedAt: Date.now() })
  await enqueueSync('game', id)
}

/**
 * Stat-recording functions below. Each writes one optimistic row to
 * `statEvents` and returns it — callers (phase 4a's stat-entry UI) use the
 * returned event to drive toasts and the goal→assist picker. There's no
 * separate "undo stack" data structure: `undoLastEvent` soft-deletes the most
 * recent live event for the game, so the event log itself is the undo stack,
 * and it can never drift out of sync with what's on screen.
 */

export interface RecordPlayerEventInput {
  gameId: string
  type: PlayerEventType
  playerId: string
  quarter: number
  gameClock?: string | null
}

export async function recordPlayerEvent(input: RecordPlayerEventInput): Promise<StatEvent> {
  const event: StatEvent = {
    id: createId(),
    gameId: input.gameId,
    type: input.type,
    playerId: input.playerId,
    quarter: input.quarter,
    gameClock: input.gameClock ?? null,
    timestamp: Date.now(),
    relatedEventId: null,
    deleted: false,
  }
  await db.statEvents.add(event)
  await enqueueSync('statEvent', event.id)
  return event
}

export interface RecordAssistInput {
  gameId: string
  playerId: string
  goalEventId: string
  quarter: number
  gameClock?: string | null
}

export async function recordAssist(input: RecordAssistInput): Promise<StatEvent> {
  const event: StatEvent = {
    id: createId(),
    gameId: input.gameId,
    type: 'assist',
    playerId: input.playerId,
    quarter: input.quarter,
    gameClock: input.gameClock ?? null,
    timestamp: Date.now(),
    relatedEventId: input.goalEventId,
    deleted: false,
  }
  await db.statEvents.add(event)
  await enqueueSync('statEvent', event.id)
  return event
}

export interface RecordTeamEventInput {
  gameId: string
  type: TeamEventType
  quarter: number
  gameClock?: string | null
}

export async function recordTeamEvent(input: RecordTeamEventInput): Promise<StatEvent> {
  const event: StatEvent = {
    id: createId(),
    gameId: input.gameId,
    type: input.type,
    playerId: null,
    quarter: input.quarter,
    gameClock: input.gameClock ?? null,
    timestamp: Date.now(),
    relatedEventId: null,
    deleted: false,
  }
  await db.statEvents.add(event)
  await enqueueSync('statEvent', event.id)
  return event
}

export interface RecordPenaltyInput {
  gameId: string
  playerId: string
  quarter: number
  penaltyDurationSeconds: PenaltyDurationSeconds
  penaltyReleasable: boolean
  gameClock?: string | null
}

export async function recordPenalty(input: RecordPenaltyInput): Promise<StatEvent> {
  const event: StatEvent = {
    id: createId(),
    gameId: input.gameId,
    type: 'penalty',
    playerId: input.playerId,
    quarter: input.quarter,
    gameClock: input.gameClock ?? null,
    timestamp: Date.now(),
    relatedEventId: null,
    deleted: false,
    penaltyDurationSeconds: input.penaltyDurationSeconds,
    penaltyReleasable: input.penaltyReleasable,
  }
  await db.statEvents.add(event)
  await enqueueSync('statEvent', event.id)
  return event
}

/** Records a `quarter_end` event for the quarter that's ending — the next quarter number is then derived automatically (see domain/quarter.ts). */
export async function advanceQuarter(gameId: string, endingQuarter: number): Promise<StatEvent> {
  return recordTeamEvent({ gameId, type: 'quarter_end', quarter: endingQuarter })
}

/** Soft-delete: used for both manual delete (event feed) and undo. */
export async function deleteEvent(id: string): Promise<void> {
  await db.statEvents.update(id, { deleted: true })
  await enqueueSync('statEvent', id)
}

/** Reverses the most recent live event for the game, whatever it was. Returns the event that was undone, if any. */
export async function undoLastEvent(gameId: string): Promise<StatEvent | undefined> {
  const events = await liveEventsForGame(gameId)
  const last = events.at(-1)
  if (!last) return undefined
  await deleteEvent(last.id)
  return last
}

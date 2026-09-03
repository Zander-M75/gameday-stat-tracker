import { db } from './db'
import { createId } from './id'
import type { Player, Position, StatEvent, Team } from './types'

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
      return team
    })()
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
  return player
}

export async function updatePlayer(id: string, changes: Partial<NewPlayerInput>): Promise<void> {
  await db.players.update(id, { ...changes, updatedAt: Date.now() })
}

export async function setPlayerActive(id: string, isActive: boolean): Promise<void> {
  await db.players.update(id, { isActive, updatedAt: Date.now() })
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
}

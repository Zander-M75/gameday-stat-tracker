import type { Game, Player, StatEvent, Team } from '../db/types'

/**
 * Local rows are camelCase with epoch-ms numbers; cloud rows are snake_case
 * with `timestamptz`. This is the one place that translation happens — see
 * `supabase/migrations/0001_init.sql`'s header comment for why the shapes
 * differ instead of mirroring field-for-field.
 */
function toISO(ms: number): string {
  return new Date(ms).toISOString()
}

/**
 * `ownerId` isn't stored locally — the local app has no concept of "who
 * owns this team" (one IndexedDB per device, inherently single-user). It's
 * supplied by the sync engine from the live Supabase session at flush time
 * instead, since that's the only place a coach's identity actually exists.
 */
export function teamToRow(team: Team, ownerId: string) {
  return {
    id: team.id,
    owner_id: ownerId,
    name: team.name,
    created_at: toISO(team.createdAt),
  }
}

export function playerToRow(player: Player) {
  return {
    id: player.id,
    team_id: player.teamId,
    jersey_number: player.jerseyNumber,
    first_name: player.firstName,
    last_name: player.lastName,
    position: player.position,
    is_active: player.isActive,
    created_at: toISO(player.createdAt),
    updated_at: toISO(player.updatedAt),
  }
}

export function gameToRow(game: Game) {
  return {
    id: game.id,
    team_id: game.teamId,
    opponent_name: game.opponentName,
    date: toISO(game.date),
    is_home: game.isHome,
    dressed_player_ids: game.dressedPlayerIds,
    status: game.status,
    created_at: toISO(game.createdAt),
    updated_at: toISO(game.updatedAt),
  }
}

export function statEventToRow(event: StatEvent) {
  return {
    id: event.id,
    game_id: event.gameId,
    player_id: event.playerId,
    type: event.type,
    quarter: event.quarter,
    game_clock: event.gameClock,
    timestamp: toISO(event.timestamp),
    related_event_id: event.relatedEventId,
    penalty_duration_seconds: event.type === 'penalty' ? event.penaltyDurationSeconds : null,
    penalty_releasable: event.type === 'penalty' ? event.penaltyReleasable : null,
    deleted: event.deleted,
  }
}

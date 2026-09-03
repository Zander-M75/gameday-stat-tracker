import type { Game, Player, StatEvent } from '../db/types'
import { computePlayerBoxScore, type PlayerBoxScoreLine, type StatTotals } from './boxScore'

export interface SeasonPlayerLine extends PlayerBoxScoreLine {
  gamesPlayed: number
}

/**
 * Season-wide per-player totals. `computePlayerBoxScore` (domain/boxScore.ts)
 * already tallies by playerId with no game scoping, so passing every event
 * across every game the team has played gets season totals for free — same
 * derive-don't-store philosophy as a single game's box score, just fed a
 * wider event list. `gamesPlayed` is the one thing the event log alone can't
 * answer (a player can be dressed and record zero events), so it's counted
 * separately from `Game.dressedPlayerIds`.
 */
export function computeSeasonBoxScore(
  players: Player[],
  games: Game[],
  events: StatEvent[],
): SeasonPlayerLine[] {
  const gamesPlayed = new Map<string, number>()
  for (const game of games) {
    for (const playerId of game.dressedPlayerIds) {
      gamesPlayed.set(playerId, (gamesPlayed.get(playerId) ?? 0) + 1)
    }
  }

  return computePlayerBoxScore(players, events).map((line) => ({
    ...line,
    gamesPlayed: gamesPlayed.get(line.player.id) ?? 0,
  }))
}

export interface PlayerGameSplit {
  game: Game
  totals: StatTotals
}

/**
 * One player's per-game lines, most recent first. A game counts if the
 * player was dressed for it OR has at least one event in it (covers a
 * player recording a stat in a game they weren't marked dressed for) —
 * `computePlayerBoxScore` still returns a valid all-zero `StatTotals` line
 * for a dressed-but-scoreless game rather than needing a special case here.
 */
export function computePlayerGameSplits(
  player: Player,
  games: Game[],
  events: StatEvent[],
): PlayerGameSplit[] {
  const eventsByGame = new Map<string, StatEvent[]>()
  for (const event of events) {
    if (event.playerId !== player.id) continue
    const list = eventsByGame.get(event.gameId)
    if (list) list.push(event)
    else eventsByGame.set(event.gameId, [event])
  }

  const relevantGameIds = new Set<string>(eventsByGame.keys())
  for (const game of games) {
    if (game.dressedPlayerIds.includes(player.id)) relevantGameIds.add(game.id)
  }

  return games
    .filter((game) => relevantGameIds.has(game.id))
    .map((game) => ({
      game,
      totals: computePlayerBoxScore([player], eventsByGame.get(game.id) ?? [])[0],
    }))
    .sort((a, b) => b.game.date - a.game.date)
}

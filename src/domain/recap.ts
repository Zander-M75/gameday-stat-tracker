import type { Game, Player, StatEvent } from '../db/types'
import { computePlayerBoxScore } from './boxScore'
import { computeScore, type Score } from './score'

export interface RecapPerformer {
  player: Player
  goals: number
  assists: number
  points: number
}

export interface RecapData {
  game: Game
  score: Score
  topPerformers: RecapPerformer[]
}

/**
 * Everything a recap graphic needs, derived from the same event log as
 * everything else on this game (no new stored state). Top performers are
 * the top three dressed players by points, ties broken by goals, with
 * zero-point players excluded — an early or defensive-battle game with
 * nobody over zero just gets an empty list, which the renderer shows as a
 * plain "no stats yet" line rather than padding it with scoreless players.
 */
export function computeRecapData(
  game: Game,
  dressedPlayers: Player[],
  events: StatEvent[],
): RecapData {
  const topPerformers = computePlayerBoxScore(dressedPlayers, events)
    .filter((line) => line.points > 0)
    .sort((a, b) => b.points - a.points || b.goals - a.goals)
    .slice(0, 3)
    .map((line) => ({
      player: line.player,
      goals: line.goals,
      assists: line.assists,
      points: line.points,
    }))

  return { game, score: computeScore(events), topPerformers }
}

import type { Player, PlayerEventType, StatEvent } from '../db/types'

/**
 * Shared shape for both a single player's line and the team's summed
 * totals. A percentage field is `null` when its denominator is zero rather
 * than 0 — lets the UI render "–" instead of a misleading 0%.
 */
export interface StatTotals {
  goals: number
  assists: number
  points: number
  shots: number
  shotsOnGoal: number
  shootingPct: number | null
  saves: number
  goalsAgainst: number
  savePct: number | null
  groundBalls: number
  faceoffWins: number
  faceoffLosses: number
  faceoffPct: number | null
  turnovers: number
  causedTurnovers: number
  penalties: number
}

export interface PlayerBoxScoreLine extends StatTotals {
  player: Player
}

export interface TeamBoxScore {
  totals: StatTotals
  clearAttempts: number
  clearSuccesses: number
  clearPct: number | null
}

function pct(made: number, attempted: number): number | null {
  return attempted > 0 ? made / attempted : null
}

export function formatPct(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)}%`
}

type PlayerTally = Record<PlayerEventType, number>

function emptyTally(): PlayerTally {
  return {
    goal: 0,
    assist: 0,
    shot: 0,
    shot_on_goal: 0,
    save: 0,
    goal_against: 0,
    ground_ball: 0,
    faceoff_win: 0,
    faceoff_loss: 0,
    turnover: 0,
    caused_turnover: 0,
  }
}

/**
 * `shot`, `shot_on_goal`, and `goal` are recorded as one event for whichever
 * outcome the coach actually saw (missed / saved-or-blocked / scored), not as
 * a base "shot" event plus follow-ups — see the note on `PlayerEventType` in
 * db/types.ts. So totals here roll the hierarchy back up: every goal was
 * also a shot on goal, and every shot on goal was also a shot.
 */
function totalsFromTally(tally: PlayerTally, penalties: number): StatTotals {
  const goals = tally.goal
  const shotsOnGoal = tally.shot_on_goal + goals
  const shots = tally.shot + shotsOnGoal
  return {
    goals,
    assists: tally.assist,
    points: goals + tally.assist,
    shots,
    shotsOnGoal,
    shootingPct: pct(goals, shots),
    saves: tally.save,
    goalsAgainst: tally.goal_against,
    savePct: pct(tally.save, tally.save + tally.goal_against),
    groundBalls: tally.ground_ball,
    faceoffWins: tally.faceoff_win,
    faceoffLosses: tally.faceoff_loss,
    faceoffPct: pct(tally.faceoff_win, tally.faceoff_win + tally.faceoff_loss),
    turnovers: tally.turnover,
    causedTurnovers: tally.caused_turnover,
    penalties,
  }
}

/**
 * Per-player box score lines for the given roster, derived fresh from the
 * live event log on every call — never stored, same philosophy as score
 * (domain/score.ts) and quarter (domain/quarter.ts).
 */
export function computePlayerBoxScore(
  players: Player[],
  events: StatEvent[],
): PlayerBoxScoreLine[] {
  const tallies = new Map<string, PlayerTally>(players.map((p) => [p.id, emptyTally()]))
  const penalties = new Map<string, number>()

  for (const event of events) {
    if (event.type === 'penalty') {
      if (tallies.has(event.playerId)) {
        penalties.set(event.playerId, (penalties.get(event.playerId) ?? 0) + 1)
      }
      continue
    }
    if (event.playerId === null) continue
    const tally = tallies.get(event.playerId)
    if (!tally) continue
    tally[event.type] += 1
  }

  return players.map((player) => ({
    player,
    ...totalsFromTally(tallies.get(player.id) ?? emptyTally(), penalties.get(player.id) ?? 0),
  }))
}

/**
 * Team totals are the sum of the already-derived player lines, plus the
 * team-level clear events, which have no per-player attribution.
 */
export function computeTeamBoxScore(
  playerLines: StatTotals[],
  events: StatEvent[],
): TeamBoxScore {
  const sum = (pick: (line: StatTotals) => number) =>
    playerLines.reduce((total, line) => total + pick(line), 0)

  const goals = sum((l) => l.goals)
  const shots = sum((l) => l.shots)
  const saves = sum((l) => l.saves)
  const goalsAgainst = sum((l) => l.goalsAgainst)
  const faceoffWins = sum((l) => l.faceoffWins)
  const faceoffLosses = sum((l) => l.faceoffLosses)

  const totals: StatTotals = {
    goals,
    assists: sum((l) => l.assists),
    points: sum((l) => l.points),
    shots,
    shotsOnGoal: sum((l) => l.shotsOnGoal),
    shootingPct: pct(goals, shots),
    saves,
    goalsAgainst,
    savePct: pct(saves, saves + goalsAgainst),
    groundBalls: sum((l) => l.groundBalls),
    faceoffWins,
    faceoffLosses,
    faceoffPct: pct(faceoffWins, faceoffWins + faceoffLosses),
    turnovers: sum((l) => l.turnovers),
    causedTurnovers: sum((l) => l.causedTurnovers),
    penalties: sum((l) => l.penalties),
  }

  const clearAttempts = events.filter((e) => e.type === 'clear_attempt').length
  const clearSuccesses = events.filter((e) => e.type === 'clear_success').length

  return { totals, clearAttempts, clearSuccesses, clearPct: pct(clearSuccesses, clearAttempts) }
}

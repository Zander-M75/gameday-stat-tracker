import type { PenaltyDurationSeconds, PlayerEventType, Position, TeamEventType } from '../db/types'

export interface StatButtonDef {
  type: PlayerEventType
  label: string
  /** Single-letter keyboard shortcut. Not wired up until the desktop layout (phase 4d), defined here so that phase doesn't have to invent it. */
  key: string
}

/**
 * Every player-attributed stat, reachable by every position regardless of
 * which are surfaced as "primary" below — the spec is explicit that nothing
 * is ever hidden, only reordered/emphasized.
 *
 * `assist` is here as a normal, always-reachable button *in addition to* the
 * inline picker the goal flow opens automatically — the picker is a shortcut
 * for the common case (touch entry, assist happens in the same moment as the
 * goal), not the only path. Desktop keyboard entry in particular needs a
 * standalone assist key so an assister can be logged as its own jersey+key
 * sequence.
 */
export const PLAYER_STAT_BUTTONS: StatButtonDef[] = [
  { type: 'goal', label: 'Goal', key: 'g' },
  { type: 'assist', label: 'Assist', key: 'a' },
  { type: 'shot', label: 'Shot', key: 's' },
  { type: 'shot_on_goal', label: 'Shot on Goal', key: 'o' },
  { type: 'save', label: 'Save', key: 'v' },
  { type: 'goal_against', label: 'Goal Against', key: 'x' },
  { type: 'ground_ball', label: 'Ground Ball', key: 'b' },
  { type: 'faceoff_win', label: 'Faceoff Win', key: 'f' },
  { type: 'faceoff_loss', label: 'Faceoff Loss', key: 'w' },
  { type: 'turnover', label: 'Turnover', key: 't' },
  { type: 'caused_turnover', label: 'Caused Turnover', key: 'c' },
]

export const PLAYER_STAT_LABEL: Record<PlayerEventType, string> = Object.fromEntries(
  PLAYER_STAT_BUTTONS.map((b) => [b.type, b.label]),
) as Record<PlayerEventType, string>

export interface TeamStatButtonDef {
  type: TeamEventType
  label: string
  key: string
}

/** `quarter_end` is deliberately excluded — it's driven by the dedicated quarter-advance control, not a generic team button, so there's only one way to end a quarter. */
export const TEAM_STAT_BUTTONS: TeamStatButtonDef[] = [
  { type: 'clear_attempt', label: 'Clear Attempt', key: 'r' },
  { type: 'clear_success', label: 'Clear Success', key: 'y' },
]

export const PENALTY_KEY = 'p'
export const PENALTY_DURATIONS: PenaltyDurationSeconds[] = [30, 60, 180]

/**
 * Stats surfaced prominently for a position — everything else stays one tap
 * away in the full grid, never hidden. Only goalie and FOGO get a
 * specialized set per the spec's examples; other positions share a
 * reasonable offense/loose-ball default rather than inventing per-position
 * tuning nobody asked for.
 */
export function primaryStatTypes(position: Position): PlayerEventType[] {
  switch (position) {
    case 'Goalie':
      return ['save', 'goal_against']
    case 'FOGO':
      return ['faceoff_win', 'faceoff_loss']
    default:
      return ['goal', 'ground_ball', 'caused_turnover']
  }
}

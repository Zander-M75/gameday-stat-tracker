import type { Player, StatEvent } from '../../db/types'
import { computePlayerBoxScore, computeTeamBoxScore } from '../../domain/boxScore'
import { BoxScoreSummary } from './BoxScoreSummary'
import { BoxScoreTable } from './BoxScoreTable'

interface BoxScorePanelProps {
  dressedPlayers: Player[]
  events: StatEvent[]
}

/**
 * Everything here is derived fresh from the live event log on every render,
 * same rule as the score header and stat entry — box scores are never
 * stored, only computed (see the note atop db/types.ts).
 */
export function BoxScorePanel({ dressedPlayers, events }: BoxScorePanelProps) {
  const lines = computePlayerBoxScore(dressedPlayers, events)
  const team = computeTeamBoxScore(lines, events)

  return (
    <div className="flex flex-col gap-4">
      <BoxScoreSummary team={team} />
      <BoxScoreTable lines={lines} totals={team.totals} />
    </div>
  )
}

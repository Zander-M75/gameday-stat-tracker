import { Link } from 'react-router-dom'
import { formatGameDate } from '../../domain/formatDate'
import type { PlayerGameSplit } from '../../domain/season'

interface PlayerGameSplitsTableProps {
  splits: PlayerGameSplit[]
}

const HEADERS = [
  'Date',
  'Opponent',
  'G',
  'A',
  'PTS',
  'SH',
  'GB',
  'FO',
  'TO',
  'CT',
  'SV',
  'GA',
  'PEN',
]

/**
 * A chronological log, not a leaderboard — rows are already ordered most
 * recent first (see `computePlayerGameSplits`), so unlike `SeasonTable`
 * there's no click-to-sort here.
 */
export function PlayerGameSplitsTable({ splits }: PlayerGameSplitsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            {HEADERS.map((label) => (
              <th
                key={label}
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {splits.map(({ game, totals }) => (
            <tr
              key={game.id}
              className="border-b border-border last:border-0 odd:bg-surface-raised even:bg-surface"
            >
              <td className="whitespace-nowrap px-3 py-2 text-text">
                <Link to={`/games/${game.id}`} className="text-accent hover:underline">
                  {formatGameDate(game.date)}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-text">
                {game.isHome ? 'vs' : '@'} {game.opponentName}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.goals}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.assists}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.points}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.shots}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.groundBalls}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">
                {totals.faceoffWins}-{totals.faceoffLosses}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.turnovers}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.causedTurnovers}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.saves}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.goalsAgainst}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text">{totals.penalties}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

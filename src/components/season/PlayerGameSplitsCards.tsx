import { Link } from 'react-router-dom'
import { formatGameDate } from '../../domain/formatDate'
import type { PlayerGameSplit } from '../../domain/season'

interface PlayerGameSplitsCardsProps {
  splits: PlayerGameSplit[]
}

export function PlayerGameSplitsCards({ splits }: PlayerGameSplitsCardsProps) {
  return (
    <ul className="flex flex-col gap-2">
      {splits.map(({ game, totals }) => (
        <li key={game.id}>
          <Link
            to={`/games/${game.id}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3 hover:border-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate font-medium text-text">
                {game.isHome ? 'vs' : '@'} {game.opponentName}
              </span>
              <span className="shrink-0 text-sm text-text-muted">{formatGameDate(game.date)}</span>
            </div>
            <dl className="grid grid-cols-4 gap-2 text-center">
              <SplitStat label="G" value={totals.goals} />
              <SplitStat label="A" value={totals.assists} />
              <SplitStat label="PTS" value={totals.points} />
              <SplitStat label="GB" value={totals.groundBalls} />
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SplitStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-surface-overlay px-1 py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="text-sm font-bold tabular-nums text-text">{value}</dd>
    </div>
  )
}

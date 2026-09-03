import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPct } from '../../domain/boxScore'
import type { SeasonPlayerLine } from '../../domain/season'

interface SeasonPlayerCardsProps {
  lines: SeasonPlayerLine[]
}

type SortKey =
  'points' | 'goals' | 'assists' | 'groundBalls' | 'causedTurnovers' | 'faceoffPct' | 'savePct'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'points', label: 'Points' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'groundBalls', label: 'Ground balls' },
  { key: 'causedTurnovers', label: 'Caused turnovers' },
  { key: 'faceoffPct', label: 'Faceoff %' },
  { key: 'savePct', label: 'Save %' },
]

/**
 * A dense table doesn't fit at 390px, so a single "sort by" select stands in
 * for the desktop table's click-to-sort columns — phase 9's spec calls for
 * stacked cards here specifically (unlike the box score table, which just
 * scrolls horizontally on phone), so this is a real second presentation,
 * not a squeezed reuse of SeasonTable.
 */
export function SeasonPlayerCards({ lines }: SeasonPlayerCardsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('points')
  const sorted = [...lines].sort((a, b) => (b[sortKey] ?? -1) - (a[sortKey] ?? -1))

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-14 items-center gap-2 text-sm text-text-muted">
        Sort by
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="min-h-14 flex-1 rounded-md border border-border bg-surface-raised px-3 text-text"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {sorted.length === 0 ? (
        <p className="p-8 text-center text-text-muted">No players yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((line) => (
            <li key={line.player.id}>
              <Link
                to={`/season/${line.player.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3 hover:border-accent"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-overlay text-base font-bold text-text">
                    {line.player.jerseyNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-text">
                    {line.player.firstName} {line.player.lastName}
                  </span>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-text-muted">
                    {line.player.position}
                  </span>
                </div>
                <dl className="grid grid-cols-4 gap-2 text-center sm:grid-cols-7">
                  <CardStat label="GP" value={line.gamesPlayed} />
                  <CardStat label="G" value={line.goals} />
                  <CardStat label="A" value={line.assists} />
                  <CardStat label="PTS" value={line.points} />
                  <CardStat label="GB" value={line.groundBalls} />
                  <CardStat label="FO%" value={formatPct(line.faceoffPct)} />
                  <CardStat label="SV%" value={formatPct(line.savePct)} />
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CardStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-surface-overlay px-1 py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="truncate text-sm font-bold tabular-nums text-text">{value}</dd>
    </div>
  )
}

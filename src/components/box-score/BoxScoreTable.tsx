import { useState } from 'react'
import { formatPct, type PlayerBoxScoreLine, type StatTotals } from '../../domain/boxScore'

interface BoxScoreTableProps {
  lines: PlayerBoxScoreLine[]
  totals: StatTotals
}

type SortDir = 'asc' | 'desc'

interface Column {
  key: string
  label: string
  title: string
  /** What gets compared when sorting by this column. */
  sortValue: (line: PlayerBoxScoreLine) => number | string
  display: (line: PlayerBoxScoreLine) => string
  totalDisplay: (totals: StatTotals) => string
}

const COLUMNS: Column[] = [
  {
    key: 'jersey',
    label: '#',
    title: 'Jersey number',
    sortValue: (l) => l.player.jerseyNumber,
    display: (l) => String(l.player.jerseyNumber),
    totalDisplay: () => '',
  },
  {
    key: 'name',
    label: 'Player',
    title: 'Player name',
    sortValue: (l) => l.player.lastName,
    display: (l) => `${l.player.firstName} ${l.player.lastName}`,
    totalDisplay: () => 'Team totals',
  },
  {
    key: 'position',
    label: 'Pos',
    title: 'Position',
    sortValue: (l) => l.player.position,
    display: (l) => l.player.position,
    totalDisplay: () => '',
  },
  {
    key: 'goals',
    label: 'G',
    title: 'Goals',
    sortValue: (l) => l.goals,
    display: (l) => String(l.goals),
    totalDisplay: (t) => String(t.goals),
  },
  {
    key: 'assists',
    label: 'A',
    title: 'Assists',
    sortValue: (l) => l.assists,
    display: (l) => String(l.assists),
    totalDisplay: (t) => String(t.assists),
  },
  {
    key: 'points',
    label: 'PTS',
    title: 'Points (goals + assists)',
    sortValue: (l) => l.points,
    display: (l) => String(l.points),
    totalDisplay: (t) => String(t.points),
  },
  {
    key: 'shots',
    label: 'SH',
    title: 'Shots',
    sortValue: (l) => l.shots,
    display: (l) => String(l.shots),
    totalDisplay: (t) => String(t.shots),
  },
  {
    key: 'shootingPct',
    label: 'SH%',
    title: 'Shooting percentage',
    sortValue: (l) => l.shootingPct ?? -1,
    display: (l) => formatPct(l.shootingPct),
    totalDisplay: (t) => formatPct(t.shootingPct),
  },
  {
    key: 'groundBalls',
    label: 'GB',
    title: 'Ground balls',
    sortValue: (l) => l.groundBalls,
    display: (l) => String(l.groundBalls),
    totalDisplay: (t) => String(t.groundBalls),
  },
  {
    key: 'faceoffs',
    label: 'FO',
    title: 'Faceoff wins-losses',
    sortValue: (l) => l.faceoffWins,
    display: (l) => `${l.faceoffWins}-${l.faceoffLosses}`,
    totalDisplay: (t) => `${t.faceoffWins}-${t.faceoffLosses}`,
  },
  {
    key: 'turnovers',
    label: 'TO',
    title: 'Turnovers',
    sortValue: (l) => l.turnovers,
    display: (l) => String(l.turnovers),
    totalDisplay: (t) => String(t.turnovers),
  },
  {
    key: 'causedTurnovers',
    label: 'CT',
    title: 'Caused turnovers',
    sortValue: (l) => l.causedTurnovers,
    display: (l) => String(l.causedTurnovers),
    totalDisplay: (t) => String(t.causedTurnovers),
  },
  {
    key: 'saves',
    label: 'SV',
    title: 'Saves',
    sortValue: (l) => l.saves,
    display: (l) => String(l.saves),
    totalDisplay: (t) => String(t.saves),
  },
  {
    key: 'savePct',
    label: 'SV%',
    title: 'Save percentage',
    sortValue: (l) => l.savePct ?? -1,
    display: (l) => formatPct(l.savePct),
    totalDisplay: (t) => formatPct(t.savePct),
  },
  {
    key: 'penalties',
    label: 'PEN',
    title: 'Penalties',
    sortValue: (l) => l.penalties,
    display: (l) => String(l.penalties),
    totalDisplay: (t) => String(t.penalties),
  },
]

/**
 * A real, dense table — not a card list stretched to fit — with a header row
 * of tap/click-to-sort columns. Wrapped in its own `overflow-x-auto` so a
 * narrow phone scrolls the table horizontally rather than squeezing fifteen
 * columns into 390px; header buttons are 56px tall (touch minimum) below
 * `xl`, then drop to a denser 40px for desktop's mouse-driven use.
 */
export function BoxScoreTable({ lines, totals }: BoxScoreTableProps) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'jersey', dir: 'asc' })

  function handleSort(key: string) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' },
    )
  }

  const sortColumn = COLUMNS.find((c) => c.key === sort.key) ?? COLUMNS[0]
  const sorted = [...lines].sort((a, b) => {
    const va = sortColumn.sortValue(a)
    const vb = sortColumn.sortValue(b)
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
    return sort.dir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-overlay">
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col" className="p-0 text-left">
                <button
                  type="button"
                  title={col.title}
                  onClick={() => handleSort(col.key)}
                  className="flex min-h-14 w-full items-center gap-1 whitespace-nowrap px-3 text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text xl:min-h-10"
                >
                  {col.label}
                  {sort.key === col.key && (
                    <span aria-hidden="true" className="text-accent">
                      {sort.dir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((line) => (
            <tr
              key={line.player.id}
              className="border-b border-border last:border-0 odd:bg-surface-raised even:bg-surface"
            >
              {COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-2 text-text">
                  {col.display(line)}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-6 text-center text-text-muted">
                No dressed players to show stats for.
              </td>
            </tr>
          )}
        </tbody>
        {sorted.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-border bg-surface-overlay font-semibold">
              {COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-2 text-text">
                  {col.totalDisplay(totals)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

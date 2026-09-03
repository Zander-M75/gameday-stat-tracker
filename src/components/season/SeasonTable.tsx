import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPct } from '../../domain/boxScore'
import { downloadCsv, toCsv } from '../../domain/csv'
import type { SeasonPlayerLine } from '../../domain/season'

interface SeasonTableProps {
  lines: SeasonPlayerLine[]
}

type SortDir = 'asc' | 'desc'

interface Column {
  key: string
  label: string
  title: string
  /** `#` and `Player` are the identity columns — always shown, can't be toggled off. */
  toggleable: boolean
  sortValue: (line: SeasonPlayerLine) => number | string
  display: (line: SeasonPlayerLine) => string
  csvValue: (line: SeasonPlayerLine) => string | number
}

const pctCsv = (value: number | null) => (value === null ? '' : Math.round(value * 100))

const COLUMNS: Column[] = [
  {
    key: 'jersey',
    label: '#',
    title: 'Jersey number',
    toggleable: false,
    sortValue: (l) => l.player.jerseyNumber,
    display: (l) => String(l.player.jerseyNumber),
    csvValue: (l) => l.player.jerseyNumber,
  },
  {
    key: 'name',
    label: 'Player',
    title: 'Player name',
    toggleable: false,
    sortValue: (l) => l.player.lastName,
    display: (l) => `${l.player.firstName} ${l.player.lastName}`,
    csvValue: (l) => `${l.player.firstName} ${l.player.lastName}`,
  },
  {
    key: 'position',
    label: 'Pos',
    title: 'Position',
    toggleable: true,
    sortValue: (l) => l.player.position,
    display: (l) => l.player.position,
    csvValue: (l) => l.player.position,
  },
  {
    key: 'gamesPlayed',
    label: 'GP',
    title: 'Games played',
    toggleable: true,
    sortValue: (l) => l.gamesPlayed,
    display: (l) => String(l.gamesPlayed),
    csvValue: (l) => l.gamesPlayed,
  },
  {
    key: 'goals',
    label: 'G',
    title: 'Goals',
    toggleable: true,
    sortValue: (l) => l.goals,
    display: (l) => String(l.goals),
    csvValue: (l) => l.goals,
  },
  {
    key: 'assists',
    label: 'A',
    title: 'Assists',
    toggleable: true,
    sortValue: (l) => l.assists,
    display: (l) => String(l.assists),
    csvValue: (l) => l.assists,
  },
  {
    key: 'points',
    label: 'PTS',
    title: 'Points (goals + assists)',
    toggleable: true,
    sortValue: (l) => l.points,
    display: (l) => String(l.points),
    csvValue: (l) => l.points,
  },
  {
    key: 'shots',
    label: 'SH',
    title: 'Shots',
    toggleable: true,
    sortValue: (l) => l.shots,
    display: (l) => String(l.shots),
    csvValue: (l) => l.shots,
  },
  {
    key: 'shootingPct',
    label: 'SH%',
    title: 'Shooting percentage',
    toggleable: true,
    sortValue: (l) => l.shootingPct ?? -1,
    display: (l) => formatPct(l.shootingPct),
    csvValue: (l) => pctCsv(l.shootingPct),
  },
  {
    key: 'groundBalls',
    label: 'GB',
    title: 'Ground balls',
    toggleable: true,
    sortValue: (l) => l.groundBalls,
    display: (l) => String(l.groundBalls),
    csvValue: (l) => l.groundBalls,
  },
  {
    key: 'faceoffs',
    label: 'FO',
    title: 'Faceoff wins-losses',
    toggleable: true,
    sortValue: (l) => l.faceoffWins,
    display: (l) => `${l.faceoffWins}-${l.faceoffLosses}`,
    csvValue: (l) => `${l.faceoffWins}-${l.faceoffLosses}`,
  },
  {
    key: 'faceoffPct',
    label: 'FO%',
    title: 'Faceoff percentage',
    toggleable: true,
    sortValue: (l) => l.faceoffPct ?? -1,
    display: (l) => formatPct(l.faceoffPct),
    csvValue: (l) => pctCsv(l.faceoffPct),
  },
  {
    key: 'turnovers',
    label: 'TO',
    title: 'Turnovers',
    toggleable: true,
    sortValue: (l) => l.turnovers,
    display: (l) => String(l.turnovers),
    csvValue: (l) => l.turnovers,
  },
  {
    key: 'causedTurnovers',
    label: 'CT',
    title: 'Caused turnovers',
    toggleable: true,
    sortValue: (l) => l.causedTurnovers,
    display: (l) => String(l.causedTurnovers),
    csvValue: (l) => l.causedTurnovers,
  },
  {
    key: 'saves',
    label: 'SV',
    title: 'Saves',
    toggleable: true,
    sortValue: (l) => l.saves,
    display: (l) => String(l.saves),
    csvValue: (l) => l.saves,
  },
  {
    key: 'goalsAgainst',
    label: 'GA',
    title: 'Goals against',
    toggleable: true,
    sortValue: (l) => l.goalsAgainst,
    display: (l) => String(l.goalsAgainst),
    csvValue: (l) => l.goalsAgainst,
  },
  {
    key: 'savePct',
    label: 'SV%',
    title: 'Save percentage',
    toggleable: true,
    sortValue: (l) => l.savePct ?? -1,
    display: (l) => formatPct(l.savePct),
    csvValue: (l) => pctCsv(l.savePct),
  },
  {
    key: 'penalties',
    label: 'PEN',
    title: 'Penalties',
    toggleable: true,
    sortValue: (l) => l.penalties,
    display: (l) => String(l.penalties),
    csvValue: (l) => l.penalties,
  },
]

/**
 * The dense, desktop-primary season table. Doubles as every "leaderboard"
 * CLAUDE.md's phase 9 spec asks for — sort by any stat column (defaults to
 * points, since that's the standard leaderboard read) instead of building a
 * separate ranked widget per stat. Column-visibility state and sort state
 * are both plain `useState`, not persisted — same "revisit only if a real
 * user finds it annoying" call phase 4d made for its shortcut-hint dismiss.
 */
export function SeasonTable({ lines }: SeasonTableProps) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'points', dir: 'desc' })
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  function handleSort(key: string) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' },
    )
  }

  function toggleColumn(key: string) {
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const visibleColumns = COLUMNS.filter((c) => !hidden.has(c.key))
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

  function handleExport() {
    // Exports every stat regardless of which columns are currently hidden —
    // visibility is a display convenience, the export is the full data dump.
    const csv = toCsv(
      COLUMNS.map((c) => c.label),
      sorted.map((line) => COLUMNS.map((c) => c.csvValue(line))),
    )
    downloadCsv('season-stats.csv', csv)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Columns:
        </span>
        {COLUMNS.filter((c) => c.toggleable).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => toggleColumn(c.key)}
            aria-pressed={!hidden.has(c.key)}
            className={`flex min-h-14 items-center rounded-full border px-3 text-xs font-semibold xl:min-h-10 ${
              hidden.has(c.key)
                ? 'border-border text-text-muted'
                : 'border-accent bg-accent/10 text-accent'
            }`}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleExport}
          className="ml-auto flex min-h-14 items-center rounded-md bg-accent px-4 text-xs font-semibold text-accent-contrast xl:min-h-10"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-overlay">
              {visibleColumns.map((col) => (
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
                {visibleColumns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-3 py-2 text-text">
                    {col.key === 'name' ? (
                      <Link
                        to={`/season/${line.player.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {col.display(line)}
                      </Link>
                    ) : (
                      col.display(line)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-3 py-6 text-center text-text-muted"
                >
                  No players yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import type { Score } from '../../domain/score'
import { quarterLabel } from '../../domain/quarter'

interface ScoreHeaderProps {
  opponentName: string
  isHome: boolean
  score: Score
  quarter: number
  onAdvanceQuarter: () => void
  onUndo: () => void
  canUndo: boolean
}

/** Persistent across every layout: score, quarter, quarter-advance, and undo are always visible without leaving the screen. */
export function ScoreHeader({
  opponentName,
  isHome,
  score,
  quarter,
  onAdvanceQuarter,
  onUndo,
  canUndo,
}: ScoreHeaderProps) {
  const [leftLabel, leftScore, rightLabel, rightScore] = isHome
    ? ['Us', score.us, opponentName, score.opponent]
    : [opponentName, score.opponent, 'Us', score.us]

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <div className="flex flex-1 items-center justify-center gap-3 text-text">
        <div className="flex flex-col items-center">
          <span className="max-w-24 truncate text-xs font-medium text-text-muted">{leftLabel}</span>
          <span className="text-3xl font-bold tabular-nums">{leftScore}</span>
        </div>
        <span className="text-xl font-bold text-text-muted">–</span>
        <div className="flex flex-col items-center">
          <span className="max-w-24 truncate text-xs font-medium text-text-muted">
            {rightLabel}
          </span>
          <span className="text-3xl font-bold tabular-nums">{rightScore}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-md bg-surface-overlay px-3 py-2 text-sm font-bold text-text">
          {quarterLabel(quarter)}
        </span>
        <button
          type="button"
          onClick={onAdvanceQuarter}
          className="flex min-h-14 items-center rounded-md border border-border px-3 text-sm font-semibold text-text"
        >
          End quarter
        </button>
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex min-h-14 items-center rounded-md border border-danger px-4 text-sm font-semibold text-danger disabled:opacity-40"
        >
          Undo
        </button>
      </div>
    </div>
  )
}

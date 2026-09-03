import { formatPct, type TeamBoxScore } from '../../domain/boxScore'

interface BoxScoreSummaryProps {
  team: TeamBoxScore
}

/**
 * Save % and faceoff % get their own large cards per the spec — those are
 * "the numbers asked about between quarters." Everything else the team
 * totals still track lands in the compact strip below, present but not
 * competing for attention.
 */
export function BoxScoreSummary({ team }: BoxScoreSummaryProps) {
  const { totals, clearAttempts, clearSuccesses, clearPct } = team

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Save %"
          value={formatPct(totals.savePct)}
          detail={`${totals.saves}/${totals.saves + totals.goalsAgainst} saves`}
        />
        <StatCard
          label="Faceoff %"
          value={formatPct(totals.faceoffPct)}
          detail={`${totals.faceoffWins}/${totals.faceoffWins + totals.faceoffLosses} won`}
        />
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <TotalItem label="SH" value={totals.shots} />
        <TotalItem label="SH%" value={formatPct(totals.shootingPct)} />
        <TotalItem label="GB" value={totals.groundBalls} />
        <TotalItem label="TO" value={totals.turnovers} />
        <TotalItem label="CT" value={totals.causedTurnovers} />
        <TotalItem label="CLR" value={`${clearSuccesses}/${clearAttempts} (${formatPct(clearPct)})`} />
      </dl>
    </div>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-3xl font-bold tabular-nums text-text">{value}</p>
      <p className="text-xs text-text-muted">{detail}</p>
    </div>
  )
}

function TotalItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-surface-overlay px-2 py-1.5 text-center">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="truncate text-sm font-bold tabular-nums text-text">{value}</dd>
    </div>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PlayerGameSplitsCards } from '../components/season/PlayerGameSplitsCards'
import { PlayerGameSplitsTable } from '../components/season/PlayerGameSplitsTable'
import { allPlayersForTeam, gamesForTeam, liveEventsForTeam } from '../db/queries'
import { formatPct } from '../domain/boxScore'
import { computePlayerGameSplits, computeSeasonBoxScore } from '../domain/season'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTeam } from '../hooks/useTeam'

export function PlayerSeasonDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const team = useTeam()
  const players = useLiveQuery(() => (team ? allPlayersForTeam(team.id) : undefined), [team?.id])
  const games = useLiveQuery(() => (team ? gamesForTeam(team.id) : undefined), [team?.id])
  const events = useLiveQuery(() => (team ? liveEventsForTeam(team.id) : undefined), [team?.id])
  const { isAtLeast } = useBreakpoint()
  const isPhone = !isAtLeast('md')

  if (!playerId) return <Navigate to="/season" replace />

  if (!team || players === undefined || games === undefined || events === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="text-text-muted">Loading…</p>
      </div>
    )
  }

  const player = players.find((p) => p.id === playerId)
  if (!player) return <Navigate to="/season" replace />

  const [seasonLine] = computeSeasonBoxScore([player], games, events)
  const splits = computePlayerGameSplits(player, games, events)

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 md:p-8">
      <div>
        <Link to="/season" className="text-sm font-medium text-text-muted hover:text-text">
          ← Season
        </Link>
        <h1 className="text-2xl font-bold text-text">
          #{player.jerseyNumber} {player.firstName} {player.lastName}
        </h1>
        <p className="text-sm text-text-muted">
          {player.position} · {seasonLine.gamesPlayed} game{seasonLine.gamesPlayed === 1 ? '' : 's'}{' '}
          played
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <SeasonStat label="G" value={seasonLine.goals} />
        <SeasonStat label="A" value={seasonLine.assists} />
        <SeasonStat label="PTS" value={seasonLine.points} />
        <SeasonStat label="SH%" value={formatPct(seasonLine.shootingPct)} />
        <SeasonStat label="GB" value={seasonLine.groundBalls} />
        <SeasonStat label="CT" value={seasonLine.causedTurnovers} />
        <SeasonStat label="TO" value={seasonLine.turnovers} />
        <SeasonStat label="FO%" value={formatPct(seasonLine.faceoffPct)} />
        <SeasonStat label="SV%" value={formatPct(seasonLine.savePct)} />
        <SeasonStat label="PEN" value={seasonLine.penalties} />
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Game-by-game
        </h2>
        {splits.length === 0 ? (
          <p className="text-sm text-text-muted">No games recorded for this player yet.</p>
        ) : isPhone ? (
          <PlayerGameSplitsCards splits={splits} />
        ) : (
          <PlayerGameSplitsTable splits={splits} />
        )}
      </section>
    </div>
  )
}

function SeasonStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-surface-overlay px-2 py-1.5 text-center">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="truncate text-sm font-bold tabular-nums text-text">{value}</dd>
    </div>
  )
}

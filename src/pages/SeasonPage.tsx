import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { SeasonPlayerCards } from '../components/season/SeasonPlayerCards'
import { SeasonTable } from '../components/season/SeasonTable'
import { allPlayersForTeam, gamesForTeam, liveEventsForTeam } from '../db/queries'
import { computeSeasonBoxScore } from '../domain/season'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTeam } from '../hooks/useTeam'

export function SeasonPage() {
  const team = useTeam()
  const players = useLiveQuery(() => (team ? allPlayersForTeam(team.id) : undefined), [team?.id])
  const games = useLiveQuery(() => (team ? gamesForTeam(team.id) : undefined), [team?.id])
  const events = useLiveQuery(() => (team ? liveEventsForTeam(team.id) : undefined), [team?.id])
  const { isAtLeast } = useBreakpoint()
  const isPhone = !isAtLeast('md')
  const [showArchived, setShowArchived] = useState(false)

  if (!team || players === undefined || games === undefined || events === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="text-text-muted">Loading season stats…</p>
      </div>
    )
  }

  const roster = players.filter((p) => showArchived || p.isActive)
  const lines = computeSeasonBoxScore(roster, games, events)

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">Season</h1>
        <label className="flex min-h-14 items-center gap-2 text-sm text-text-muted xl:min-h-10">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
          Show archived
        </label>
      </header>

      {games.length === 0 ? (
        <p className="p-8 text-center text-text-muted">
          No games recorded yet — season stats show up here once games are played.
        </p>
      ) : isPhone ? (
        <SeasonPlayerCards lines={lines} />
      ) : (
        <SeasonTable lines={lines} />
      )}
    </div>
  )
}

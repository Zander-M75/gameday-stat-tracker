import { useLiveQuery } from 'dexie-react-hooks'
import { Link, Navigate, useParams } from 'react-router-dom'
import { StatEntryPanel } from '../components/stat-entry/StatEntryPanel'
import { allPlayersForTeam, getGame, setGameStatus } from '../db/queries'
import { formatGameDate } from '../domain/formatDate'

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const game = useLiveQuery(() => (gameId ? getGame(gameId) : undefined), [gameId])
  const players = useLiveQuery(
    () => (game ? allPlayersForTeam(game.teamId) : undefined),
    [game?.teamId],
  )

  if (!gameId) return <Navigate to="/games" replace />

  if (game === undefined || players === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="text-text-muted">Loading…</p>
      </div>
    )
  }

  const dressed = players
    .filter((p) => game.dressedPlayerIds.includes(p.id))
    .sort((a, b) => a.jerseyNumber - b.jerseyNumber)

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/games" className="text-sm font-medium text-text-muted hover:text-text">
            ← Games
          </Link>
          <h1 className="text-2xl font-bold text-text">
            {game.isHome ? 'vs' : '@'} {game.opponentName}
          </h1>
          <p className="text-sm text-text-muted">
            {formatGameDate(game.date)} · {game.isHome ? 'Home' : 'Away'} ·{' '}
            {game.status === 'in_progress' ? 'In progress' : 'Final'}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            void setGameStatus(game.id, game.status === 'in_progress' ? 'final' : 'in_progress')
          }
          className="flex min-h-14 items-center rounded-md border border-border px-4 text-sm font-semibold text-text"
        >
          {game.status === 'in_progress' ? 'Mark final' : 'Reopen game'}
        </button>
      </div>

      {dressed.length === 0 && (
        <p className="text-sm text-text-muted">
          No players were marked dressed for this game — team-level events are still recordable
          below, but player stats have nothing to attribute to.
        </p>
      )}

      <StatEntryPanel game={game} allPlayers={players} dressedPlayers={dressed} />
    </div>
  )
}

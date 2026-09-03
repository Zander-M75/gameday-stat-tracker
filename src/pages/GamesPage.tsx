import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NewGameForm } from '../components/games/NewGameForm'
import { activePlayersForTeam, createGame, gamesForTeam } from '../db/queries'
import type { Game } from '../db/types'
import { formatGameDate } from '../domain/formatDate'
import { useTeam } from '../hooks/useTeam'

export function GamesPage() {
  const team = useTeam()
  const games = useLiveQuery(() => (team ? gamesForTeam(team.id) : undefined), [team?.id])
  const activePlayers = useLiveQuery(
    () => (team ? activePlayersForTeam(team.id) : undefined),
    [team?.id],
  )
  const [showNewGame, setShowNewGame] = useState(false)
  const navigate = useNavigate()

  if (!team || games === undefined || activePlayers === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="text-text-muted">Loading games…</p>
      </div>
    )
  }

  const inProgress = games.filter((g) => g.status === 'in_progress')
  const past = games.filter((g) => g.status === 'final')

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">Games</h1>
        <button
          type="button"
          disabled={activePlayers.length === 0}
          onClick={() => setShowNewGame((v) => !v)}
          className="flex min-h-14 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-contrast disabled:opacity-40"
        >
          {showNewGame ? 'Close' : 'New game'}
        </button>
      </header>

      {activePlayers.length === 0 && (
        <p className="text-sm text-text-muted">
          <Link to="/roster" className="font-semibold text-accent">
            Add players to your roster
          </Link>{' '}
          before creating a game.
        </p>
      )}

      {showNewGame && (
        <NewGameForm
          activePlayers={activePlayers}
          onCreate={async (input) => {
            const game = await createGame(team.id, input)
            setShowNewGame(false)
            navigate(`/games/${game.id}`)
          }}
          onCancel={() => setShowNewGame(false)}
        />
      )}

      <GameSection title="In progress" games={inProgress} emptyText="No games in progress." />
      <GameSection title="Past games" games={past} emptyText="No completed games yet." />
    </div>
  )
}

function GameSection({
  title,
  games,
  emptyText,
}: {
  title: string
  games: Game[]
  emptyText: string
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      {games.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
        </ul>
      )}
    </section>
  )
}

function GameRow({ game }: { game: Game }) {
  return (
    <li>
      <Link
        to={`/games/${game.id}`}
        className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface-raised px-3 py-2 hover:border-accent"
      >
        <span className="w-12 shrink-0 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {game.isHome ? 'Home' : 'Away'}
        </span>
        <span className="min-w-32 flex-1 truncate font-medium text-text">
          {game.isHome ? 'vs' : '@'} {game.opponentName}
        </span>
        <span className="shrink-0 text-sm text-text-muted">{formatGameDate(game.date)}</span>
        {game.status === 'in_progress' && (
          <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
            Live
          </span>
        )}
      </Link>
    </li>
  )
}

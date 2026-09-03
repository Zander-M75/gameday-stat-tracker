import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BulkAddPanel } from '../components/roster/BulkAddPanel'
import { PlayerForm } from '../components/roster/PlayerForm'
import { PlayerRow } from '../components/roster/PlayerRow'
import { addPlayer, allPlayersForTeam, bulkAddPlayers } from '../db/queries'
import { useTeam } from '../hooks/useTeam'

type SortDirection = 'asc' | 'desc'

const toggleButtonClasses =
  'flex min-h-14 items-center rounded-md border border-border px-4 text-sm font-semibold text-text'

export function RosterPage() {
  const team = useTeam()
  const players = useLiveQuery(() => (team ? allPlayersForTeam(team.id) : undefined), [team?.id])

  const [showArchived, setShowArchived] = useState(false)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)

  if (!team || players === undefined) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="text-text-muted">Loading roster…</p>
      </div>
    )
  }

  const visible = players
    .filter((p) => showArchived || p.isActive)
    .sort((a, b) =>
      sortDir === 'asc' ? a.jerseyNumber - b.jerseyNumber : b.jerseyNumber - a.jerseyNumber,
    )

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">Roster</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowAddForm((v) => !v)
              setShowBulkAdd(false)
            }}
            className={
              showAddForm
                ? toggleButtonClasses
                : `${toggleButtonClasses} bg-accent text-accent-contrast border-transparent`
            }
          >
            {showAddForm ? 'Close' : 'Add player'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBulkAdd((v) => !v)
              setShowAddForm(false)
            }}
            className={toggleButtonClasses}
          >
            {showBulkAdd ? 'Close' : 'Bulk add'}
          </button>
        </div>
      </header>

      {showAddForm && (
        <section className="rounded-lg border border-border bg-surface-raised p-3">
          <PlayerForm
            submitLabel="Add player"
            onSubmit={async (input) => {
              await addPlayer(team.id, input)
            }}
          />
        </section>
      )}

      {showBulkAdd && (
        <BulkAddPanel
          existingNumbers={players.map((p) => p.jerseyNumber)}
          onAdd={async (inputs) => {
            await bulkAddPlayers(team.id, inputs)
            setShowBulkAdd(false)
          }}
          onCancel={() => setShowBulkAdd(false)}
        />
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="flex min-h-10 items-center gap-1 font-semibold text-text"
        >
          # {sortDir === 'asc' ? '↑' : '↓'}
        </button>
        <label className="flex min-h-10 items-center gap-2 text-text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
          Show archived
        </label>
        <span className="ml-auto text-text-muted">
          {visible.length} player{visible.length === 1 ? '' : 's'}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="p-8 text-center text-text-muted">
          {players.length === 0
            ? 'No players yet. Add one, or paste in a roster with Bulk add.'
            : 'No active players. Toggle "Show archived" to see archived players.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </ul>
      )}
    </div>
  )
}

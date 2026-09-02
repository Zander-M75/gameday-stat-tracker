import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { clearDatabase, seedDatabase } from '../db/seed'

/**
 * Dev-only DB dump. Not linked from app navigation — visit /debug directly.
 * Exists so phase 1 (data model + local DB) has something to look at and poke
 * before any real UI is built on top of it.
 */
export function DebugPage() {
  const teams = useLiveQuery(() => db.teams.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])
  const games = useLiveQuery(() => db.games.toArray(), [])
  const statEvents = useLiveQuery(() => db.statEvents.orderBy('timestamp').toArray(), [])
  const syncQueue = useLiveQuery(() => db.syncQueue.toArray(), [])

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-text">DB debug</h1>
        <button
          className="min-h-10 rounded-md bg-accent px-4 text-sm font-semibold text-accent-contrast"
          onClick={() => void seedDatabase()}
        >
          Seed (if empty)
        </button>
        <button
          className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-text"
          onClick={() => void seedDatabase({ force: true })}
        >
          Reseed (force)
        </button>
        <button
          className="min-h-10 rounded-md border border-danger px-4 text-sm font-semibold text-danger"
          onClick={() => void clearDatabase()}
        >
          Clear DB
        </button>
      </div>

      <Table title="teams" rows={teams} />
      <Table title="players" rows={players} />
      <Table title="games" rows={games} />
      <Table title="statEvents" rows={statEvents} />
      <Table title="syncQueue" rows={syncQueue} />
    </div>
  )
}

function Table({ title, rows }: { title: string; rows: unknown[] | undefined }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title} ({rows?.length ?? '…'})
      </h2>
      <pre className="max-h-80 overflow-auto rounded-md border border-border bg-surface-raised p-3 text-xs text-text">
        {JSON.stringify(rows, null, 2)}
      </pre>
    </section>
  )
}

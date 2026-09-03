import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/db'
import { deletePlayer, setPlayerActive, updatePlayer } from '../../db/queries'
import type { Player } from '../../db/types'
import { PlayerForm } from './PlayerForm'

const actionButtonClasses =
  'flex min-h-14 items-center rounded-md px-3 text-sm font-semibold whitespace-nowrap'

export function PlayerRow({ player }: { player: Player }) {
  const [editing, setEditing] = useState(false)
  // Delete is only offered once we know for certain there's nothing to
  // lose — undefined (still loading) is treated the same as "has events",
  // i.e. the button stays disabled rather than flashing enabled early.
  const liveEventCount = useLiveQuery(
    () => db.statEvents.where('playerId').equals(player.id).filter((e) => !e.deleted).count(),
    [player.id],
  )
  const canDelete = liveEventCount === 0

  if (editing) {
    return (
      <li className="rounded-lg border border-border bg-surface-raised p-3">
        <PlayerForm
          initialValues={{
            jerseyNumber: player.jerseyNumber,
            firstName: player.firstName,
            lastName: player.lastName,
            position: player.position,
          }}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await updatePlayer(player.id, input)
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface-raised p-3 ${
        player.isActive ? '' : 'opacity-50'
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-overlay text-base font-bold text-text">
        {player.jerseyNumber}
      </span>
      <span className="min-w-32 flex-1 truncate text-text">
        {player.firstName} {player.lastName}
      </span>
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-text-muted">
        {player.position}
      </span>
      <div className="ml-auto flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`${actionButtonClasses} text-accent`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => void setPlayerActive(player.id, !player.isActive)}
          className={`${actionButtonClasses} text-text-muted`}
        >
          {player.isActive ? 'Archive' : 'Restore'}
        </button>
        <button
          type="button"
          disabled={!canDelete}
          title={
            canDelete
              ? undefined
              : 'This player has recorded stats — archive them instead of deleting.'
          }
          onClick={() => {
            if (
              window.confirm(
                `Permanently delete ${player.firstName} ${player.lastName}? This can't be undone.`,
              )
            ) {
              void deletePlayer(player.id)
            }
          }}
          className={`${actionButtonClasses} text-danger disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

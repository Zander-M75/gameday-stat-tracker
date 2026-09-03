import type { Player, StatEvent } from '../../db/types'
import { describeEvent } from '../../domain/eventDescription'
import { quarterLabel } from '../../domain/quarter'

interface EventFeedProps {
  events: StatEvent[]
  playerById: Map<string, Player>
  onDelete: (event: StatEvent) => void
}

/** Most recent first. Rough list for phase 4a — the collapsible strip (phone) and live column (iPad/desktop) are later phases. */
export function EventFeed({ events, playerById, onDelete }: EventFeedProps) {
  const recent = [...events].reverse()

  if (recent.length === 0) {
    return <p className="text-sm text-text-muted">No events recorded yet.</p>
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {recent.map((event) => (
        <li
          key={event.id}
          className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"
        >
          <span className="w-9 shrink-0 text-xs font-semibold text-text-muted">
            {quarterLabel(event.quarter)}
          </span>
          <span className="flex-1 truncate text-text">{describeEvent(event, playerById)}</span>
          <span className="shrink-0 text-xs text-text-muted">
            {new Date(event.timestamp).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
          <button
            type="button"
            onClick={() => onDelete(event)}
            aria-label={`Delete: ${describeEvent(event, playerById)}`}
            className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:text-danger"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

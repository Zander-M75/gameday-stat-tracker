import { useState } from 'react'
import type { Player, StatEvent } from '../../db/types'
import { describeEvent } from '../../domain/eventDescription'
import { EventFeed } from './EventFeed'

interface EventFeedStripProps {
  events: StatEvent[]
  playerById: Map<string, Player>
  onDelete: (event: StatEvent) => void
}

/**
 * Collapsed strip pinned to the bottom of the screen (phase 4b): shows only
 * the most recent event so it never competes with stat entry for thumb
 * space, and expands in one tap to the full feed with delete.
 */
export function EventFeedStrip({ events, playerById, onDelete }: EventFeedStripProps) {
  const [expanded, setExpanded] = useState(false)
  const latest = events[events.length - 1]

  return (
    <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-surface px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-14 w-full items-center justify-between gap-2 text-left"
      >
        <span className="truncate text-sm text-text-muted">
          {latest ? describeEvent(latest, playerById) : 'No events recorded yet'}
        </span>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {expanded ? 'Hide' : `${events.length} events`}
        </span>
      </button>

      {expanded && (
        <div className="max-h-[40vh] overflow-y-auto pb-2">
          <EventFeed events={events} playerById={playerById} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}

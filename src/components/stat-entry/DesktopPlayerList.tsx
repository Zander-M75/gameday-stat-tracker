import type { Player } from '../../db/types'

interface DesktopPlayerListProps {
  players: Player[]
  selectedPlayerId: string | null
  onSelect: (playerId: string) => void
}

/**
 * Desktop player pane (phase 4d): a compact list rather than big touch
 * tiles — mouse precision means density beats size here, and the primary
 * selection path is typing a jersey number anyway (see
 * DesktopStatEntryLayout's keyboard handling). This is the visual reference
 * and the mouse fallback; both drive the same selection state.
 */
export function DesktopPlayerList({ players, selectedPlayerId, onSelect }: DesktopPlayerListProps) {
  if (players.length === 0) {
    return <p className="text-sm text-text-muted">No dressed players for this game.</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {players.map((player) => {
        const selected = player.id === selectedPlayerId
        return (
          <li key={player.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(player.id)}
              className={`flex min-h-10 w-full items-center gap-3 rounded-md border px-3 text-sm ${
                selected
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-border text-text hover:border-accent/50'
              }`}
            >
              <span className="w-8 shrink-0 text-right font-bold tabular-nums">
                {player.jerseyNumber}
              </span>
              <span className="flex-1 truncate text-left">
                {player.firstName} {player.lastName}
              </span>
              <span className="shrink-0 text-xs uppercase tracking-wide text-text-muted">
                {player.position}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

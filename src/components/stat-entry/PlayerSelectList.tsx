import type { Player } from '../../db/types'

interface PlayerSelectListProps {
  players: Player[]
  selectedPlayerId: string | null
  onSelect: (playerId: string) => void
}

/**
 * Rough functional version for phase 4a — proves selection drives the right
 * stat buttons and the right recorded playerId. The jersey-grid-first,
 * two-tap phone layout is phase 4b; this just needs to work.
 */
export function PlayerSelectList({ players, selectedPlayerId, onSelect }: PlayerSelectListProps) {
  if (players.length === 0) {
    return <p className="text-sm text-text-muted">No dressed players for this game.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {players.map((player) => {
        const selected = player.id === selectedPlayerId
        return (
          <button
            key={player.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(player.id)}
            className={`flex min-h-14 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${
              selected
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-border text-text hover:border-accent/50'
            }`}
          >
            <span className="tabular-nums">#{player.jerseyNumber}</span>
            <span className="text-text-muted">{player.lastName}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {player.position}
            </span>
          </button>
        )
      })}
    </div>
  )
}

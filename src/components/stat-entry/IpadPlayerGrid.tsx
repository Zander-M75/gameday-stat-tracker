import type { Player } from '../../db/types'

interface IpadPlayerGridProps {
  players: Player[]
  selectedPlayerId: string | null
  onSelect: (playerId: string) => void
}

/**
 * iPad player picker (phase 4c): unlike the phone grid, this stays mounted
 * next to the stat buttons at all times instead of swapping away, so the
 * selected player needs a visible highlight.
 */
export function IpadPlayerGrid({ players, selectedPlayerId, onSelect }: IpadPlayerGridProps) {
  if (players.length === 0) {
    return <p className="text-sm text-text-muted">No dressed players for this game.</p>
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
      {players.map((player) => {
        const selected = player.id === selectedPlayerId
        return (
          <button
            key={player.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(player.id)}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg border py-2 ${
              selected
                ? 'border-accent bg-accent/20'
                : 'border-border bg-surface-raised hover:border-accent/50'
            }`}
          >
            <span className="text-xl font-bold tabular-nums text-text">{player.jerseyNumber}</span>
            <span className="max-w-full truncate px-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              {player.lastName}
            </span>
          </button>
        )
      })}
    </div>
  )
}

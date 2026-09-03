import type { Player } from '../../db/types'

interface PlayerJerseyGridProps {
  players: Player[]
  onSelect: (playerId: string) => void
}

/**
 * Phone player picker (phase 4b): a grid of big jersey numbers, filtered to
 * dressed players. One tap hands off to PhoneStatButtons, which replaces this
 * grid entirely — so there's no "selected" visual state to show here.
 */
export function PlayerJerseyGrid({ players, onSelect }: PlayerJerseyGridProps) {
  if (players.length === 0) {
    return <p className="text-sm text-text-muted">No dressed players for this game.</p>
  }

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          onClick={() => onSelect(player.id)}
          className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-surface-raised py-2 active:border-accent active:bg-accent/20"
        >
          <span className="text-xl font-bold tabular-nums text-text">{player.jerseyNumber}</span>
          <span className="max-w-full truncate px-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            {player.lastName}
          </span>
        </button>
      ))}
    </div>
  )
}

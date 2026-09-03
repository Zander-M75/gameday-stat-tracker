import type { Player, PlayerEventType } from '../../db/types'
import { PLAYER_STAT_BUTTONS, primaryStatTypes } from '../../domain/statButtons'

interface PhoneStatButtonsProps {
  player: Player
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onBack: () => void
}

/**
 * Replaces the jersey grid once a player is selected (phase 4b) — the second
 * of the two taps, so the thumb never has to travel back up to a player list.
 * Position-primary stats (e.g. Save/Goal Against for a goalie) get a bigger
 * row up top; everything else stays one tap away below, per spec — nothing
 * is ever hidden, only reordered.
 */
export function PhoneStatButtons({ player, onStat, onPenalty, onBack }: PhoneStatButtonsProps) {
  const primary = primaryStatTypes(player.position)
  const rest = PLAYER_STAT_BUTTONS.filter((b) => !primary.includes(b.type))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-text">
          #{player.jerseyNumber} {player.lastName}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-14 items-center rounded-md px-3 text-sm font-semibold text-text-muted"
        >
          Change player
        </button>
      </div>

      {primary.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {primary.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onStat(type)}
              className="flex min-h-16 items-center justify-center rounded-lg border border-accent bg-accent/10 px-3 text-base font-bold text-accent"
            >
              {PLAYER_STAT_BUTTONS.find((b) => b.type === type)?.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {rest.map((button) => (
          <button
            key={button.type}
            type="button"
            onClick={() => onStat(button.type)}
            className="flex min-h-14 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-text"
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onPenalty}
          className="flex min-h-14 items-center justify-center rounded-lg border border-danger px-3 text-sm font-semibold text-danger"
        >
          Penalty
        </button>
      </div>
    </div>
  )
}

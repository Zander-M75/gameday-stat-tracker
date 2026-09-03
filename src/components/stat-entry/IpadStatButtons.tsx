import type { Player, PlayerEventType, TeamEventType } from '../../db/types'
import { PLAYER_STAT_BUTTONS, primaryStatTypes, TEAM_STAT_BUTTONS } from '../../domain/statButtons'

interface IpadStatButtonsProps {
  player: Player | null
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onTeamEvent: (type: TeamEventType) => void
}

/**
 * Persistent stat-button column (phase 4c) — always mounted next to the
 * player grid, unlike phone's swap-in panel. Player buttons disable until a
 * player is selected; team buttons need no selection so stay enabled below.
 */
export function IpadStatButtons({ player, onStat, onPenalty, onTeamEvent }: IpadStatButtonsProps) {
  const disabled = !player
  const primary = player ? primaryStatTypes(player.position) : []
  const rest = PLAYER_STAT_BUTTONS.filter((b) => !primary.includes(b.type))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {player ? `#${player.jerseyNumber} ${player.lastName}` : 'Select a player'}
        </h3>

        {primary.length > 0 && (
          <div className="mb-2 flex flex-col gap-2">
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

        <div className="flex flex-col gap-2">
          {rest.map((button) => (
            <button
              key={button.type}
              type="button"
              disabled={disabled}
              onClick={() => onStat(button.type)}
              className="flex min-h-14 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-text disabled:opacity-30"
            >
              {button.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={onPenalty}
            className="flex min-h-14 items-center justify-center rounded-lg border border-danger px-3 text-sm font-semibold text-danger disabled:opacity-30"
          >
            Penalty
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Team</h3>
        <div className="flex flex-col gap-2">
          {TEAM_STAT_BUTTONS.map((button) => (
            <button
              key={button.type}
              type="button"
              onClick={() => onTeamEvent(button.type)}
              className="flex min-h-14 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-text"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

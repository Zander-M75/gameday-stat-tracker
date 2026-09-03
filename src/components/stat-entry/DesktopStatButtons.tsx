import type { Player, PlayerEventType, TeamEventType } from '../../db/types'
import {
  PENALTY_KEY,
  PLAYER_STAT_BUTTONS,
  primaryStatTypes,
  TEAM_STAT_BUTTONS,
} from '../../domain/statButtons'

interface DesktopStatButtonsProps {
  player: Player | null
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onTeamEvent: (type: TeamEventType) => void
}

function Kbd({ label }: { label: string }) {
  return (
    <span className="ml-auto shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-muted">
      {label}
    </span>
  )
}

/**
 * Desktop stat pane (phase 4d): every button shows the keyboard shortcut
 * printed on it — see DesktopStatEntryLayout for the listener that actually
 * drives it. Mouse click fires the same handler, so both paths stay in sync
 * for free.
 */
export function DesktopStatButtons({
  player,
  onStat,
  onPenalty,
  onTeamEvent,
}: DesktopStatButtonsProps) {
  const disabled = !player
  const primaryTypes = player ? primaryStatTypes(player.position) : []
  const primaryButtons = PLAYER_STAT_BUTTONS.filter((b) => primaryTypes.includes(b.type))
  const restButtons = PLAYER_STAT_BUTTONS.filter((b) => !primaryTypes.includes(b.type))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {player ? `#${player.jerseyNumber} ${player.lastName}` : 'Type a jersey number'}
        </h3>

        {primaryButtons.length > 0 && (
          <div className="mb-2 flex flex-col gap-1.5">
            {primaryButtons.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => onStat(def.type)}
                className="flex min-h-11 items-center gap-2 rounded-md border border-accent bg-accent/10 px-3 text-sm font-bold text-accent"
              >
                {def.label}
                <Kbd label={def.key} />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {restButtons.map((button) => (
            <button
              key={button.type}
              type="button"
              disabled={disabled}
              onClick={() => onStat(button.type)}
              className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text disabled:opacity-30"
            >
              {button.label}
              <Kbd label={button.key} />
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={onPenalty}
            className="flex min-h-10 items-center gap-2 rounded-md border border-danger px-3 text-sm font-semibold text-danger disabled:opacity-30"
          >
            Penalty
            <Kbd label={PENALTY_KEY} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Team</h3>
        <div className="flex flex-col gap-1.5">
          {TEAM_STAT_BUTTONS.map((button) => (
            <button
              key={button.type}
              type="button"
              onClick={() => onTeamEvent(button.type)}
              className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text"
            >
              {button.label}
              <Kbd label={button.key} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

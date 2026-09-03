import type { PlayerEventType, Position, TeamEventType } from '../../db/types'
import { PLAYER_STAT_BUTTONS, primaryStatTypes, TEAM_STAT_BUTTONS } from '../../domain/statButtons'

interface StatButtonGridProps {
  selectedPlayerLabel: string | null
  selectedPosition: Position | null
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onTeamEvent: (type: TeamEventType) => void
}

const statButtonClasses =
  'flex min-h-14 items-center justify-center rounded-md border px-3 text-sm font-semibold disabled:opacity-30'

/**
 * Every stat is reachable regardless of position — this just puts the ones
 * relevant to the selected player's position first, at a larger size.
 * Layout-specific replace-not-duplicate behavior (phone/iPad) comes in
 * phase 4b/4c; this rough version shows the full set below the highlights.
 */
export function StatButtonGrid({
  selectedPlayerLabel,
  selectedPosition,
  onStat,
  onPenalty,
  onTeamEvent,
}: StatButtonGridProps) {
  const disabled = !selectedPlayerLabel
  const primary = selectedPosition ? primaryStatTypes(selectedPosition) : []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {selectedPlayerLabel ? `For ${selectedPlayerLabel}` : 'Select a player'}
        </h3>
        {primary.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {primary.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onStat(type)}
                className={`${statButtonClasses} min-w-28 border-accent bg-accent/10 text-accent`}
              >
                {PLAYER_STAT_BUTTONS.find((b) => b.type === type)?.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PLAYER_STAT_BUTTONS.map((button) => (
            <button
              key={button.type}
              type="button"
              disabled={disabled}
              onClick={() => onStat(button.type)}
              className={`${statButtonClasses} border-border text-text`}
            >
              {button.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={onPenalty}
            className={`${statButtonClasses} border-danger text-danger`}
          >
            Penalty
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Team</h3>
        <div className="flex flex-wrap gap-2">
          {TEAM_STAT_BUTTONS.map((button) => (
            <button
              key={button.type}
              type="button"
              onClick={() => onTeamEvent(button.type)}
              className={`${statButtonClasses} border-border text-text`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

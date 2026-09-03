import type { Player, PlayerEventType, StatEvent, TeamEventType } from '../../db/types'
import { TEAM_STAT_BUTTONS } from '../../domain/statButtons'
import { EventFeedStrip } from './EventFeedStrip'
import { PhoneStatButtons } from './PhoneStatButtons'
import { PlayerJerseyGrid } from './PlayerJerseyGrid'

interface PhoneStatEntryLayoutProps {
  dressedPlayers: Player[]
  selectedPlayer: Player | null
  onSelectPlayer: (playerId: string) => void
  onBack: () => void
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onTeamEvent: (type: TeamEventType) => void
  events: StatEvent[]
  playerById: Map<string, Player>
  onDeleteEvent: (event: StatEvent) => void
}

/**
 * Phone layout (phase 4b): two taps total. Tapping a jersey number in the
 * grid replaces it with that player's stat buttons (PhoneStatButtons) so the
 * thumb never has to travel back up to a player list. Team-level events
 * don't need a player selected, so that row stays above the swap.
 */
export function PhoneStatEntryLayout({
  dressedPlayers,
  selectedPlayer,
  onSelectPlayer,
  onBack,
  onStat,
  onPenalty,
  onTeamEvent,
  events,
  playerById,
  onDeleteEvent,
}: PhoneStatEntryLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex gap-2.5">
        {TEAM_STAT_BUTTONS.map((button) => (
          <button
            key={button.type}
            type="button"
            onClick={() => onTeamEvent(button.type)}
            className="flex min-h-14 flex-1 items-center justify-center rounded-md border border-border text-xs font-semibold uppercase tracking-wide text-text-muted"
          >
            {button.label}
          </button>
        ))}
      </div>

      {selectedPlayer ? (
        <PhoneStatButtons
          player={selectedPlayer}
          onStat={onStat}
          onPenalty={onPenalty}
          onBack={onBack}
        />
      ) : (
        <PlayerJerseyGrid players={dressedPlayers} onSelect={onSelectPlayer} />
      )}

      <EventFeedStrip events={events} playerById={playerById} onDelete={onDeleteEvent} />
    </div>
  )
}

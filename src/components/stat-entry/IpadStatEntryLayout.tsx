import type { Player, PlayerEventType, StatEvent, TeamEventType } from '../../db/types'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { EventFeed } from './EventFeed'
import { IpadPlayerGrid } from './IpadPlayerGrid'
import { IpadStatButtons } from './IpadStatButtons'

interface IpadStatEntryLayoutProps {
  dressedPlayers: Player[]
  selectedPlayer: Player | null
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onTeamEvent: (type: TeamEventType) => void
  events: StatEvent[]
  playerById: Map<string, Player>
  onDeleteEvent: (event: StatEvent) => void
}

/**
 * iPad layout (phase 4c): the player grid and stat buttons are both always
 * mounted side by side — no swap, no "back" step, unlike phone. Landscape
 * has room for the event feed as a third column; portrait stacks it below
 * the grid/buttons row instead.
 */
export function IpadStatEntryLayout({
  dressedPlayers,
  selectedPlayer,
  selectedPlayerId,
  onSelectPlayer,
  onStat,
  onPenalty,
  onTeamEvent,
  events,
  playerById,
  onDeleteEvent,
}: IpadStatEntryLayoutProps) {
  const { orientation } = useBreakpoint()
  const isLandscape = orientation === 'landscape'

  const feedColumn = (
    <div className={isLandscape ? 'w-72 shrink-0' : ''}>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Event feed
      </h2>
      <EventFeed events={events} playerById={playerById} onDelete={onDeleteEvent} />
    </div>
  )

  return (
    <div className={`flex flex-1 gap-6 ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      <div className="flex flex-[1.4] gap-6">
        <div className="min-w-0 flex-1">
          <IpadPlayerGrid
            players={dressedPlayers}
            selectedPlayerId={selectedPlayerId}
            onSelect={onSelectPlayer}
          />
        </div>
        <div className="w-64 shrink-0">
          <IpadStatButtons
            player={selectedPlayer}
            onStat={onStat}
            onPenalty={onPenalty}
            onTeamEvent={onTeamEvent}
          />
        </div>
      </div>

      {feedColumn}
    </div>
  )
}

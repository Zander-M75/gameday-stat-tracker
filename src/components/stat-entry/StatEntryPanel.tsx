import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import {
  advanceQuarter,
  deleteEvent,
  liveEventsForGame,
  recordAssist,
  recordPenalty,
  recordPlayerEvent,
  recordTeamEvent,
  undoLastEvent,
} from '../../db/queries'
import type {
  Game,
  PenaltyDurationSeconds,
  Player,
  PlayerEventType,
  StatEvent,
  TeamEventType,
} from '../../db/types'
import { describeEvent } from '../../domain/eventDescription'
import { vibrate } from '../../domain/haptics'
import { currentQuarter } from '../../domain/quarter'
import { computeScore } from '../../domain/score'
import { useToast } from '../../toast/ToastProvider'
import { AssistPicker } from './AssistPicker'
import { EventFeed } from './EventFeed'
import { PenaltyPicker } from './PenaltyPicker'
import { PlayerSelectList } from './PlayerSelectList'
import { ScoreHeader } from './ScoreHeader'
import { StatButtonGrid } from './StatButtonGrid'

interface StatEntryPanelProps {
  game: Game
  allPlayers: Player[]
  dressedPlayers: Player[]
}

interface PendingAssist {
  goalEventId: string
  scorerId: string
}

interface PendingPenalty {
  playerId: string
}

/**
 * Shared stat-entry logic and a rough functional UI (phase 4a). Phone/iPad/
 * desktop layouts (4b-4d) will replace how this looks and how a player+stat
 * get picked, but should reuse the handlers here rather than re-deriving
 * them — the recording, undo, toast, and haptic behavior is the same on
 * every device.
 */
export function StatEntryPanel({ game, allPlayers, dressedPlayers }: StatEntryPanelProps) {
  const { showToast } = useToast()
  const events = useLiveQuery(() => liveEventsForGame(game.id), [game.id]) ?? []

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [pendingAssist, setPendingAssist] = useState<PendingAssist | null>(null)
  const [pendingPenalty, setPendingPenalty] = useState<PendingPenalty | null>(null)

  const playerById = useMemo(() => new Map(allPlayers.map((p) => [p.id, p])), [allPlayers])
  const quarter = currentQuarter(events)
  const score = computeScore(events)
  const selectedPlayer = selectedPlayerId ? (playerById.get(selectedPlayerId) ?? null) : null

  async function announce(promise: Promise<StatEvent>): Promise<StatEvent> {
    const event = await promise
    showToast(describeEvent(event, playerById))
    vibrate()
    return event
  }

  function dismissPickers() {
    setPendingAssist(null)
    setPendingPenalty(null)
  }

  function handleSelectPlayer(playerId: string) {
    dismissPickers()
    setSelectedPlayerId((current) => (current === playerId ? null : playerId))
  }

  async function handleStat(type: PlayerEventType) {
    if (!selectedPlayerId) return
    dismissPickers()
    const event = await announce(
      recordPlayerEvent({ gameId: game.id, type, playerId: selectedPlayerId, quarter }),
    )
    if (type === 'goal') {
      setPendingAssist({ goalEventId: event.id, scorerId: selectedPlayerId })
    }
  }

  async function handleTeamEvent(type: TeamEventType) {
    dismissPickers()
    await announce(recordTeamEvent({ gameId: game.id, type, quarter }))
  }

  function handlePenaltyButton() {
    if (!selectedPlayerId) return
    setPendingAssist(null)
    setPendingPenalty({ playerId: selectedPlayerId })
  }

  async function handleAssistPick(playerId: string) {
    const pending = pendingAssist
    setPendingAssist(null)
    if (!pending) return
    await announce(
      recordAssist({ gameId: game.id, playerId, goalEventId: pending.goalEventId, quarter }),
    )
  }

  async function handlePenaltyConfirm(duration: PenaltyDurationSeconds, releasable: boolean) {
    const pending = pendingPenalty
    setPendingPenalty(null)
    if (!pending) return
    await announce(
      recordPenalty({
        gameId: game.id,
        playerId: pending.playerId,
        quarter,
        penaltyDurationSeconds: duration,
        penaltyReleasable: releasable,
      }),
    )
  }

  async function handleAdvanceQuarter() {
    dismissPickers()
    await announce(advanceQuarter(game.id, quarter))
  }

  async function handleUndo() {
    dismissPickers()
    const undone = await undoLastEvent(game.id)
    if (undone) {
      showToast(`Undid: ${describeEvent(undone, playerById)}`)
      vibrate()
    }
  }

  async function handleDeleteFeedItem(event: StatEvent) {
    await deleteEvent(event.id)
    showToast(`Deleted: ${describeEvent(event, playerById)}`)
  }

  const scorer = pendingAssist ? playerById.get(pendingAssist.scorerId) : undefined
  const penaltyPlayer = pendingPenalty ? playerById.get(pendingPenalty.playerId) : undefined

  return (
    <div className="flex flex-col gap-4">
      <ScoreHeader
        opponentName={game.opponentName}
        isHome={game.isHome}
        score={score}
        quarter={quarter}
        onAdvanceQuarter={() => void handleAdvanceQuarter()}
        onUndo={() => void handleUndo()}
        canUndo={events.length > 0}
      />

      {pendingAssist && scorer && (
        <AssistPicker
          scorer={scorer}
          candidates={dressedPlayers.filter((p) => p.id !== pendingAssist.scorerId)}
          onPick={(playerId) => void handleAssistPick(playerId)}
          onDismiss={() => setPendingAssist(null)}
        />
      )}

      {pendingPenalty && penaltyPlayer && (
        <PenaltyPicker
          player={penaltyPlayer}
          onConfirm={(duration, releasable) => void handlePenaltyConfirm(duration, releasable)}
          onDismiss={() => setPendingPenalty(null)}
        />
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Player
        </h2>
        <PlayerSelectList
          players={dressedPlayers}
          selectedPlayerId={selectedPlayerId}
          onSelect={handleSelectPlayer}
        />
      </section>

      <section>
        <StatButtonGrid
          selectedPlayerLabel={
            selectedPlayer ? `#${selectedPlayer.jerseyNumber} ${selectedPlayer.lastName}` : null
          }
          selectedPosition={selectedPlayer?.position ?? null}
          onStat={(type) => void handleStat(type)}
          onPenalty={handlePenaltyButton}
          onTeamEvent={(type) => void handleTeamEvent(type)}
        />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Event feed
        </h2>
        <EventFeed
          events={events}
          playerById={playerById}
          onDelete={(event) => void handleDeleteFeedItem(event)}
        />
      </section>
    </div>
  )
}

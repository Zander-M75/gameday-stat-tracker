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
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useToast } from '../../toast/ToastProvider'
import { AssistPicker } from './AssistPicker'
import { DesktopStatEntryLayout } from './DesktopStatEntryLayout'
import { IpadStatEntryLayout } from './IpadStatEntryLayout'
import { PenaltyPicker } from './PenaltyPicker'
import { PhoneStatEntryLayout } from './PhoneStatEntryLayout'
import { ScoreHeader } from './ScoreHeader'

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
 * Shared stat-entry logic, orchestrating three per-device presentations
 * (phone, iPad, desktop — phases 4b-4d) that all read/write the same state
 * and call the same handlers here. Only how a player+stat get picked differs
 * per layout; recording, undo, toast, and haptic behavior is identical
 * everywhere.
 */
export function StatEntryPanel({ game, allPlayers, dressedPlayers }: StatEntryPanelProps) {
  const { showToast } = useToast()
  const { isAtLeast } = useBreakpoint()
  const isPhone = !isAtLeast('md')
  const isIpad = isAtLeast('md') && !isAtLeast('xl')
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

  function handleBackToGrid() {
    dismissPickers()
    setSelectedPlayerId(null)
  }

  /** Direct-set, not toggle — driven by DesktopStatEntryLayout's jersey-number keyboard buffer. */
  function handleMatchPlayer(playerId: string | null) {
    dismissPickers()
    setSelectedPlayerId(playerId)
  }

  async function handleStat(type: PlayerEventType) {
    if (!selectedPlayerId) return
    dismissPickers()
    const playerId = selectedPlayerId
    setSelectedPlayerId(null)
    const event = await announce(recordPlayerEvent({ gameId: game.id, type, playerId, quarter }))
    if (type === 'goal') {
      setPendingAssist({ goalEventId: event.id, scorerId: playerId })
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
    setSelectedPlayerId(null)
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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
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

      {isPhone ? (
        <PhoneStatEntryLayout
          dressedPlayers={dressedPlayers}
          selectedPlayer={selectedPlayer}
          onSelectPlayer={handleSelectPlayer}
          onBack={handleBackToGrid}
          onStat={(type) => void handleStat(type)}
          onPenalty={handlePenaltyButton}
          onTeamEvent={(type) => void handleTeamEvent(type)}
          events={events}
          playerById={playerById}
          onDeleteEvent={(event) => void handleDeleteFeedItem(event)}
        />
      ) : isIpad ? (
        <IpadStatEntryLayout
          dressedPlayers={dressedPlayers}
          selectedPlayer={selectedPlayer}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={handleSelectPlayer}
          onStat={(type) => void handleStat(type)}
          onPenalty={handlePenaltyButton}
          onTeamEvent={(type) => void handleTeamEvent(type)}
          events={events}
          playerById={playerById}
          onDeleteEvent={(event) => void handleDeleteFeedItem(event)}
        />
      ) : (
        <DesktopStatEntryLayout
          dressedPlayers={dressedPlayers}
          selectedPlayer={selectedPlayer}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={handleSelectPlayer}
          onMatchPlayer={handleMatchPlayer}
          onClearSelection={handleBackToGrid}
          onStat={(type) => void handleStat(type)}
          onPenalty={handlePenaltyButton}
          onTeamEvent={(type) => void handleTeamEvent(type)}
          onUndo={() => void handleUndo()}
          events={events}
          playerById={playerById}
          onDeleteEvent={(event) => void handleDeleteFeedItem(event)}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { Player, PlayerEventType, StatEvent, TeamEventType } from '../../db/types'
import { PENALTY_KEY, PLAYER_STAT_BUTTONS, TEAM_STAT_BUTTONS } from '../../domain/statButtons'
import { DesktopPlayerList } from './DesktopPlayerList'
import { DesktopStatButtons } from './DesktopStatButtons'
import { EventFeed } from './EventFeed'

interface DesktopStatEntryLayoutProps {
  dressedPlayers: Player[]
  selectedPlayer: Player | null
  selectedPlayerId: string | null
  /** Mouse click on a list row — toggles, same as phone/iPad. */
  onSelectPlayer: (playerId: string) => void
  /** Keyboard jersey-buffer resolution — sets directly, no toggle (see below). */
  onMatchPlayer: (playerId: string | null) => void
  onClearSelection: () => void
  onStat: (type: PlayerEventType) => void
  onPenalty: () => void
  onTeamEvent: (type: TeamEventType) => void
  onUndo: () => void
  events: StatEvent[]
  playerById: Map<string, Player>
  onDeleteEvent: (event: StatEvent) => void
}

function isTypingIntoField(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

/**
 * Desktop layout (phase 4d): three panes (player list, stat buttons, live
 * event feed) plus a keyboard-driven entry path — type a jersey number
 * (kept as a sliding 2-digit buffer, no Enter needed) to select a player,
 * then a single letter to record a stat, mirroring what's printed on every
 * button. Mouse click on any row or button does the exact same thing,
 * through the exact same handlers passed down from StatEntryPanel.
 *
 * The keydown listener lives in this component specifically so it only
 * exists while this layout is mounted — below the desktop breakpoint,
 * StatEntryPanel renders phone/iPad instead and this never mounts, which is
 * what keeps these shortcuts from leaking into the touch layouts.
 */
export function DesktopStatEntryLayout({
  dressedPlayers,
  selectedPlayer,
  selectedPlayerId,
  onSelectPlayer,
  onMatchPlayer,
  onClearSelection,
  onStat,
  onPenalty,
  onTeamEvent,
  onUndo,
  events,
  playerById,
  onDeleteEvent,
}: DesktopStatEntryLayoutProps) {
  const [jerseyBuffer, setJerseyBuffer] = useState('')
  const [hintDismissed, setHintDismissed] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingIntoField()) return

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        onUndo()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        setJerseyBuffer('')
        onClearSelection()
        return
      }

      if (/^[0-9]$/.test(e.key)) {
        setJerseyBuffer((current) => {
          const next = (current + e.key).slice(-2)
          const match = dressedPlayers.find((p) => String(p.jerseyNumber) === next)
          onMatchPlayer(match ? match.id : null)
          return next
        })
        return
      }

      const key = e.key.toLowerCase()

      const teamButton = TEAM_STAT_BUTTONS.find((b) => b.key === key)
      if (teamButton) {
        setJerseyBuffer('')
        onTeamEvent(teamButton.type)
        return
      }

      if (key === PENALTY_KEY) {
        setJerseyBuffer('')
        if (selectedPlayerId) onPenalty()
        return
      }

      const statButton = PLAYER_STAT_BUTTONS.find((b) => b.key === key)
      if (statButton && selectedPlayerId) {
        setJerseyBuffer('')
        onStat(statButton.type)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    dressedPlayers,
    selectedPlayerId,
    onMatchPlayer,
    onClearSelection,
    onStat,
    onPenalty,
    onTeamEvent,
    onUndo,
  ])

  return (
    <div className="flex flex-1 flex-col gap-3">
      {!hintDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-text-muted">
          <span>
            Type a jersey number, then a stat key (shown on each button) · Esc clears selection · ⌘Z
            / Ctrl+Z undo
          </span>
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            className="shrink-0 font-semibold text-text-muted hover:text-text"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="text-xs text-text-muted">
        Jersey: <span className="font-mono text-text">{jerseyBuffer || '—'}</span>
        {selectedPlayer && (
          <span className="ml-2 text-accent">
            → #{selectedPlayer.jerseyNumber} {selectedPlayer.lastName}
          </span>
        )}
      </div>

      <div className="grid flex-1 grid-cols-[1fr_280px_320px] gap-6">
        <div className="min-w-0">
          <DesktopPlayerList
            players={dressedPlayers}
            selectedPlayerId={selectedPlayerId}
            onSelect={onSelectPlayer}
          />
        </div>
        <div>
          <DesktopStatButtons
            player={selectedPlayer}
            onStat={onStat}
            onPenalty={onPenalty}
            onTeamEvent={onTeamEvent}
          />
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Event feed
          </h2>
          <EventFeed events={events} playerById={playerById} onDelete={onDeleteEvent} />
        </div>
      </div>
    </div>
  )
}

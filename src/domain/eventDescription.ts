import type { Player, StatEvent } from '../db/types'
import { quarterLabel } from './quarter'
import { PLAYER_STAT_LABEL } from './statButtons'

function playerLabel(playerId: string, playerById: Map<string, Player>): string {
  const player = playerById.get(playerId)
  return player ? `#${player.jerseyNumber} ${player.lastName}` : 'Unknown player'
}

/** Human copy for toasts and the event feed — one line per event type. */
export function describeEvent(event: StatEvent, playerById: Map<string, Player>): string {
  switch (event.type) {
    case 'penalty':
      return `${playerLabel(event.playerId, playerById)} — Penalty (${event.penaltyDurationSeconds}s${
        event.penaltyReleasable ? '' : ', non-releasable'
      })`
    case 'clear_attempt':
      return 'Clear Attempt'
    case 'clear_success':
      return 'Clear Success'
    case 'quarter_end':
      return `End of ${quarterLabel(event.quarter)}`
    default:
      return `${playerLabel(event.playerId, playerById)} — ${PLAYER_STAT_LABEL[event.type]}`
  }
}

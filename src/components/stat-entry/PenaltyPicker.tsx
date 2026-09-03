import { useState } from 'react'
import type { PenaltyDurationSeconds, Player } from '../../db/types'
import { PENALTY_DURATIONS } from '../../domain/statButtons'

interface PenaltyPickerProps {
  player: Player
  onConfirm: (duration: PenaltyDurationSeconds, releasable: boolean) => void
  onDismiss: () => void
}

/** Two-step inline picker: duration, then releasable — either step dismissible without recording anything. */
export function PenaltyPicker({ player, onConfirm, onDismiss }: PenaltyPickerProps) {
  const [duration, setDuration] = useState<PenaltyDurationSeconds | null>(null)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-danger bg-danger/10 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">
          Penalty on #{player.jerseyNumber} {player.lastName}
          {duration ? ` — ${duration}s` : ''}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-10 rounded-md px-3 text-sm font-semibold text-text-muted"
        >
          Cancel
        </button>
      </div>

      {duration === null ? (
        <div className="flex flex-wrap gap-2">
          {PENALTY_DURATIONS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => setDuration(seconds)}
              className="flex min-h-12 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text"
            >
              {seconds}s
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onConfirm(duration, true)}
            className="flex min-h-12 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text"
          >
            Releasable
          </button>
          <button
            type="button"
            onClick={() => onConfirm(duration, false)}
            className="flex min-h-12 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text"
          >
            Non-releasable
          </button>
        </div>
      )}
    </div>
  )
}

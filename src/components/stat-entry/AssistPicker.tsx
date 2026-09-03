import type { Player } from '../../db/types'

interface AssistPickerProps {
  scorer: Player
  candidates: Player[]
  onPick: (playerId: string) => void
  onDismiss: () => void
}

/**
 * Opens automatically right after a goal is recorded. Dismissible in one tap
 * and never blocks: any other action (selecting a player, hitting another
 * stat button, undo) also dismisses this — see StatEntryPanel.
 */
export function AssistPicker({ scorer, candidates, onPick, onDismiss }: AssistPickerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-accent bg-accent/10 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">
          Assist on #{scorer.jerseyNumber} {scorer.lastName}&rsquo;s goal?
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-10 rounded-md px-3 text-sm font-semibold text-text-muted"
        >
          No assist
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {candidates.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => onPick(player.id)}
            className="flex min-h-12 items-center gap-1 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text"
          >
            <span className="tabular-nums">#{player.jerseyNumber}</span>
            <span className="text-text-muted">{player.lastName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

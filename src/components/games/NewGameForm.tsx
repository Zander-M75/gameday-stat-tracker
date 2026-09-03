import { useId, useState, type FormEvent } from 'react'
import type { NewGameInput } from '../../db/queries'
import type { Player } from '../../db/types'
import { dateInputValueToEpoch, todayDateInputValue } from '../../domain/formatDate'

interface NewGameFormProps {
  activePlayers: Player[]
  onCreate: (input: NewGameInput) => void | Promise<void>
  onCancel: () => void
}

const fieldInputClasses =
  'h-14 rounded-md border border-border bg-surface px-3 text-text focus:border-accent focus:outline-none'

export function NewGameForm({ activePlayers, onCreate, onCancel }: NewGameFormProps) {
  const idPrefix = useId()
  const [opponentName, setOpponentName] = useState('')
  const [date, setDate] = useState(todayDateInputValue)
  const [isHome, setIsHome] = useState(true)
  const [dressedIds, setDressedIds] = useState<Set<string>>(
    () => new Set(activePlayers.map((p) => p.id)),
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const isValid = opponentName.trim().length > 0 && date.length > 0
  const sortedPlayers = [...activePlayers].sort((a, b) => a.jerseyNumber - b.jerseyNumber)

  function toggleDressed(id: string) {
    setDressedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitAttempted(true)
    if (!isValid) return
    void onCreate({
      opponentName: opponentName.trim(),
      date: dateInputValueToEpoch(date),
      isHome,
      dressedPlayerIds: [...dressedIds],
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4"
    >
      <div className="flex flex-wrap gap-3">
        <label
          htmlFor={`${idPrefix}-opp`}
          className="flex flex-1 flex-col gap-1 text-xs font-medium text-text-muted"
        >
          Opponent
          <input
            id={`${idPrefix}-opp`}
            type="text"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Lakeview"
            className={`${fieldInputClasses} min-w-40`}
          />
        </label>
        <label
          htmlFor={`${idPrefix}-date`}
          className="flex flex-col gap-1 text-xs font-medium text-text-muted"
        >
          Date
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldInputClasses}
          />
        </label>
        <div className="flex flex-col gap-1 text-xs font-medium text-text-muted">
          Home / away
          <div className="flex h-14 overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setIsHome(true)}
              className={`flex-1 px-4 text-sm font-semibold ${
                isHome ? 'bg-accent text-accent-contrast' : 'text-text-muted'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setIsHome(false)}
              className={`flex-1 px-4 text-sm font-semibold ${
                !isHome ? 'bg-accent text-accent-contrast' : 'text-text-muted'
              }`}
            >
              Away
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">
            Dressed ({dressedIds.size}/{activePlayers.length})
          </span>
          <div className="flex gap-3 text-xs font-semibold text-accent">
            <button
              type="button"
              onClick={() => setDressedIds(new Set(activePlayers.map((p) => p.id)))}
              className="flex min-h-14 items-center xl:min-h-10"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDressedIds(new Set())}
              className="flex min-h-14 items-center xl:min-h-10"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedPlayers.map((player) => {
            const dressed = dressedIds.has(player.id)
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => toggleDressed(player.id)}
                aria-pressed={dressed}
                className={`flex min-h-14 min-w-14 items-center justify-center rounded-md border px-2 text-sm font-semibold ${
                  dressed
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-border text-text-muted opacity-60'
                }`}
              >
                #{player.jerseyNumber}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="flex min-h-14 items-center rounded-md bg-accent px-5 font-semibold text-accent-contrast"
        >
          Start game
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-14 items-center rounded-md border border-border px-4 text-text-muted"
        >
          Cancel
        </button>
        {submitAttempted && !isValid && (
          <span className="text-sm text-danger">Enter an opponent name and date.</span>
        )}
      </div>
    </form>
  )
}

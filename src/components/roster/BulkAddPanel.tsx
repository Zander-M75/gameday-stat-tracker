import { useMemo, useState } from 'react'
import type { NewPlayerInput } from '../../db/queries'
import { parseRosterInput } from '../../domain/parseRosterInput'

interface BulkAddPanelProps {
  existingNumbers: number[]
  onAdd: (inputs: NewPlayerInput[]) => void | Promise<void>
  onCancel: () => void
}

const PLACEHOLDER = '23 Danny Keane Attack\n14 Ethan Marsh FOGO\n1 Jake Sullivan G'

export function BulkAddPanel({ existingNumbers, onAdd, onCancel }: BulkAddPanelProps) {
  const [raw, setRaw] = useState('')

  const rows = useMemo(() => parseRosterInput(raw), [raw])

  const rowsWithDuplicates = useMemo(() => {
    const seen = new Set(existingNumbers)
    const numbersInBatch = new Set<number>()
    return rows.map((row) => {
      const duplicate =
        row.jerseyNumber !== null &&
        (seen.has(row.jerseyNumber) || numbersInBatch.has(row.jerseyNumber))
      if (row.jerseyNumber !== null) numbersInBatch.add(row.jerseyNumber)
      return { ...row, duplicate }
    })
  }, [rows, existingNumbers])

  const validRows = rowsWithDuplicates.filter((row) => row.errors.length === 0)
  const skippedCount = rows.length - validRows.length

  function handleAdd() {
    if (validRows.length === 0) return
    const inputs: NewPlayerInput[] = validRows.map((row) => ({
      jerseyNumber: row.jerseyNumber as number,
      firstName: row.firstName,
      lastName: row.lastName,
      position: row.position!,
    }))
    void onAdd(inputs)
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <div>
        <p className="text-sm font-semibold text-text">Bulk add</p>
        <p className="text-xs text-text-muted">
          One player per line: number, first name, last name, position — e.g. &ldquo;23 Danny Keane
          Attack&rdquo;. Position abbreviations (A, M, D, LSM, FOGO, G) work too, and the order of
          number/name/position doesn&rsquo;t matter.
        </p>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={6}
        placeholder={PLACEHOLDER}
        className="min-h-32 w-full resize-y rounded-md border border-border bg-surface p-3 font-mono text-sm text-text focus:border-accent focus:outline-none"
      />

      {rowsWithDuplicates.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {rowsWithDuplicates.map((row) => (
            <li
              key={row.lineNumber}
              className={`rounded px-2 py-1 font-mono ${
                row.errors.length > 0
                  ? 'bg-danger/10 text-danger'
                  : row.duplicate
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted'
              }`}
            >
              {row.line}
              {row.errors.length > 0 && <span> — {row.errors.join(', ')}</span>}
              {row.errors.length === 0 && row.duplicate && <span> — duplicate jersey number</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={validRows.length === 0}
          onClick={handleAdd}
          className="flex min-h-14 items-center rounded-md bg-accent px-5 font-semibold text-accent-contrast disabled:opacity-40"
        >
          Add {validRows.length} player{validRows.length === 1 ? '' : 's'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-14 items-center rounded-md border border-border px-4 text-text-muted"
        >
          Cancel
        </button>
        {skippedCount > 0 && (
          <span className="text-xs text-text-muted">
            {skippedCount} row{skippedCount === 1 ? '' : 's'} will be skipped.
          </span>
        )}
      </div>
    </section>
  )
}

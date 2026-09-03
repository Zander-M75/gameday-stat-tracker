import { useId, useState, type FormEvent, type ReactNode } from 'react'
import type { NewPlayerInput } from '../../db/queries'
import type { Position } from '../../db/types'
import { POSITIONS } from '../../domain/positions'

interface PlayerFormProps {
  initialValues?: NewPlayerInput
  submitLabel: string
  onSubmit: (input: NewPlayerInput) => void | Promise<void>
  onCancel?: () => void
}

const BLANK: NewPlayerInput = { jerseyNumber: 0, firstName: '', lastName: '', position: 'Attack' }

const inputClasses =
  'h-14 min-w-0 rounded-md border border-border bg-surface px-3 text-text focus:border-accent focus:outline-none'

export function PlayerForm({ initialValues, submitLabel, onSubmit, onCancel }: PlayerFormProps) {
  const [values, setValues] = useState<NewPlayerInput>(initialValues ?? BLANK)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const idPrefix = useId()

  const jerseyValid = Number.isInteger(values.jerseyNumber) && values.jerseyNumber >= 0
  const namesValid = values.firstName.trim().length > 0 && values.lastName.trim().length > 0
  const isValid = jerseyValid && namesValid

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitAttempted(true)
    if (!isValid) return
    void onSubmit({
      jerseyNumber: values.jerseyNumber,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      position: values.position,
    })
    if (!initialValues) {
      setValues(BLANK)
      setSubmitAttempted(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <Field label="#" htmlFor={`${idPrefix}-num`}>
        <input
          id={`${idPrefix}-num`}
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          value={values.jerseyNumber}
          onChange={(e) => setValues((v) => ({ ...v, jerseyNumber: Number(e.target.value) }))}
          className={`${inputClasses} w-20 text-center text-lg font-semibold`}
        />
      </Field>
      <Field label="First name" htmlFor={`${idPrefix}-first`}>
        <input
          id={`${idPrefix}-first`}
          type="text"
          value={values.firstName}
          onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
          className={`${inputClasses} w-36`}
        />
      </Field>
      <Field label="Last name" htmlFor={`${idPrefix}-last`}>
        <input
          id={`${idPrefix}-last`}
          type="text"
          value={values.lastName}
          onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
          className={`${inputClasses} w-36`}
        />
      </Field>
      <Field label="Position" htmlFor={`${idPrefix}-pos`}>
        <select
          id={`${idPrefix}-pos`}
          value={values.position}
          onChange={(e) => setValues((v) => ({ ...v, position: e.target.value as Position }))}
          className={inputClasses}
        >
          {POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex min-h-14 items-center rounded-md bg-accent px-5 font-semibold text-accent-contrast"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-14 items-center rounded-md border border-border px-4 text-text-muted"
          >
            Cancel
          </button>
        )}
      </div>
      {submitAttempted && !isValid && (
        <p className="w-full text-sm text-danger">Enter a jersey number, first and last name.</p>
      )}
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1 text-xs font-medium text-text-muted">
      {label}
      {children}
    </label>
  )
}

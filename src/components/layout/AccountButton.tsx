import { Link } from 'react-router-dom'
import { AccountIcon } from '../icons'

/**
 * The bottom tab bar is fixed to exactly Roster/Games/Season (phase 0), and
 * auth (phase 7) is additive rather than a fourth primary destination — so
 * on phone/iPad-portrait, where there's no sidebar to tuck an account link
 * into, this is a small floating entry point to `/account` instead.
 */
export function AccountButton() {
  return (
    <Link
      to="/account"
      aria-label="Account"
      className="fixed left-2 z-50 flex size-14 items-center justify-center rounded-full border border-border bg-surface-raised text-text-muted shadow-lg hover:text-text"
      style={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <AccountIcon className="size-5" />
    </Link>
  )
}

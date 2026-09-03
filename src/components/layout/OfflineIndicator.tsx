import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/**
 * A small, unobtrusive corner badge — visible only while the device has no
 * network. The app itself never blocks on connectivity (CLAUDE.md's
 * offline-first rule); this just tells the coach why, if they're wondering,
 * without a banner that eats screen space one-handed on the sideline.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div
      role="status"
      className="fixed right-2 z-50 flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs font-semibold text-text-muted shadow-lg"
      style={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
      Offline
    </div>
  )
}

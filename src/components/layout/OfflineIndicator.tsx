import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/**
 * A small, unobtrusive badge — visible only while the device has no
 * network. The app itself never blocks on connectivity (CLAUDE.md's
 * offline-first rule); this just tells the coach why, if they're wondering,
 * without a banner that eats screen space one-handed on the sideline.
 *
 * Positioning is owned by `StatusBadges`, which stacks this alongside
 * `SyncStatusIndicator` (phase 8) — this component just renders its pill or
 * nothing.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div
      role="status"
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs font-semibold text-text-muted shadow-lg"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
      Offline
    </div>
  )
}

import { useSyncStatus } from '../../sync/useSyncStatus'

/**
 * Small, unobtrusive — visible only while there's actually something
 * unsynced, never a blocking spinner (CLAUDE.md's phase 8 spec). Renders
 * nothing at all when Supabase isn't configured, since sync doesn't apply.
 */
export function SyncStatusIndicator() {
  const { configured, isSyncing, pendingCount } = useSyncStatus()
  if (!configured || pendingCount === 0) return null

  return (
    <div
      role="status"
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs font-semibold text-text-muted shadow-lg"
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${isSyncing ? 'animate-pulse bg-accent' : 'bg-text-muted'}`}
        aria-hidden="true"
      />
      {isSyncing ? `Syncing ${pendingCount}…` : `${pendingCount} pending`}
    </div>
  )
}

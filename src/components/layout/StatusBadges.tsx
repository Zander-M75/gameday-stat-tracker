import { OfflineIndicator } from './OfflineIndicator'
import { SyncStatusIndicator } from './SyncStatusIndicator'

/**
 * Fixed top-right, stacking whichever badges below are actually visible —
 * flex `gap` only applies between rendered children, so this self-arranges
 * whether zero, one, or both are showing without either indicator needing
 * to know about the other or own its own position.
 */
export function StatusBadges() {
  return (
    <div
      className="fixed right-2 z-50 flex flex-col items-end gap-1.5"
      style={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <OfflineIndicator />
      <SyncStatusIndicator />
    </div>
  )
}

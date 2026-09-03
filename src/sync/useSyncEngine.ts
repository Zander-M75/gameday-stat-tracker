import { useEffect } from 'react'
import { flushSyncQueue } from './syncEngine'

const RETRY_INTERVAL_MS = 20_000

/**
 * Mounted once at the app root (see App.tsx). Triggers a flush attempt on
 * mount, whenever the browser regains connectivity, and on a light interval
 * as a fallback for failures that don't correspond to an online/offline
 * transition (a Supabase hiccup, an expired session). `flushSyncQueue` is
 * itself a no-op when there's nothing to do, so calling it opportunistically
 * here is always cheap.
 *
 * There's no per-write trigger — a stat event doesn't need to reach the
 * cloud within milliseconds of being recorded, only "eventually, in the
 * background" (CLAUDE.md's phase 8 spec). A short interval keeps this
 * simple instead of threading a flush call through every write in
 * db/queries.ts.
 */
export function useSyncEngine(): void {
  useEffect(() => {
    void flushSyncQueue()

    function handleOnline() {
      void flushSyncQueue()
    }
    window.addEventListener('online', handleOnline)

    const interval = setInterval(() => void flushSyncQueue(), RETRY_INTERVAL_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
    }
  }, [])
}

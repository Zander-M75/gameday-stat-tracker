import { useLiveQuery } from 'dexie-react-hooks'
import { useSyncExternalStore } from 'react'
import { db } from '../db/db'
import { supabase } from '../supabase/client'
import { getIsSyncing, subscribeSyncing } from './syncEngine'

export interface SyncStatus {
  configured: boolean
  isSyncing: boolean
  pendingCount: number
}

export function useSyncStatus(): SyncStatus {
  const isSyncing = useSyncExternalStore(subscribeSyncing, getIsSyncing)
  // Reactive to any syncQueue write via Dexie's liveQuery — filtered in JS
  // for the same null-index reason documented in syncEngine.ts.
  const pendingCount =
    useLiveQuery(async () => {
      const items = await db.syncQueue.toArray()
      return items.filter((item) => item.syncedAt === null).length
    }, []) ?? 0

  return { configured: supabase !== null, isSyncing, pendingCount }
}

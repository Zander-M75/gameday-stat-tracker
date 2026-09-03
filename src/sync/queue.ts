import { db } from '../db/db'
import type { SyncEntityType, SyncOperation } from '../db/types'

/**
 * Marks one entity as needing a sync push. Deduped by a deterministic id
 * (`${entityType}:${entityId}`) rather than a fresh uuid per call, so
 * writing the same entity twice before it ever syncs collapses into one
 * row instead of piling up duplicates — matching the "a record queued
 * twice before it ever syncs just flushes its latest state" behavior
 * described on `SyncQueueItem` in db/types.ts. This also reopens an
 * already-synced item (resets `syncedAt`/`attempts`/`lastError`) whenever
 * the entity changes again, so an edit to a previously-synced record gets
 * picked back up.
 *
 * Deliberately just a local Dexie write — no network call, no import of the
 * sync engine — so every call site in db/queries.ts stays a fast, optimistic
 * local write. Triggering an actual flush is the sync engine's job (see
 * useSyncEngine.ts), not this module's.
 */
export async function enqueueSync(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation = 'upsert',
): Promise<void> {
  await db.syncQueue.put({
    id: `${entityType}:${entityId}`,
    entityType,
    entityId,
    operation,
    enqueuedAt: Date.now(),
    syncedAt: null,
    attempts: 0,
    lastError: null,
  })
}

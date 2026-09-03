import { db } from '../db/db'
import type { SyncEntityType, SyncQueueItem } from '../db/types'
import { supabase } from '../supabase/client'
import { gameToRow, playerToRow, statEventToRow, teamToRow } from './mapping'

const TABLE_FOR: Record<SyncEntityType, string> = {
  team: 'teams',
  player: 'players',
  game: 'games',
  statEvent: 'stat_events',
}

/**
 * Supabase-js throws `PostgrestError` — a plain object (`message`/`details`/
 * `hint`/`code`), not a native `Error` — so a naive `error instanceof Error`
 * check falls through to `String(error)`, which stringifies any plain object
 * as the useless "[object Object]". Pull the real Postgres error text out
 * instead, so `SyncQueueItem.lastError` is actually diagnosable.
 */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const { message, details, hint, code } = error as Record<string, unknown>
    return [code, message, details, hint].filter(Boolean).join(' | ')
  }
  return String(error)
}

let isSyncing = false
const listeners = new Set<() => void>()

function setSyncing(value: boolean) {
  isSyncing = value
  listeners.forEach((listener) => listener())
}

export function getIsSyncing(): boolean {
  return isSyncing
}

/** For useSyncStatus's useSyncExternalStore — see src/sync/useSyncStatus.ts. */
export function subscribeSyncing(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Flushes every pending syncQueue item to Supabase, oldest first. Safe to
 * call from anywhere at any time: it's a no-op when unconfigured, offline,
 * signed out, or already running (the `isSyncing` guard), and a per-item
 * failure is recorded on that item (attempts/lastError) rather than thrown —
 * one bad row can never surface as an error or block the rest of the queue.
 * This is the concrete form of CLAUDE.md's "never let a sync failure
 * interrupt stat entry" rule.
 */
export async function flushSyncQueue(): Promise<void> {
  if (!supabase || isSyncing || !navigator.onLine) return
  // Set synchronously, before any `await` — two calls triggered close
  // together (e.g. mount + an 'online' event firing in the same tick) would
  // otherwise both read `isSyncing` as false and both slip past the guard
  // before either gets a chance to flip it.
  setSyncing(true)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const ownerId = session?.user.id
    // RLS checks teams.owner_id = auth.uid() (directly or via the team_id/
    // game_id chain) on every table — with no session there is no valid
    // owner to stamp a new team with and nothing would pass the policy
    // check anyway, so there's nothing useful to push yet.
    if (!ownerId) return

    const items = await db.syncQueue.toArray()
    // `syncedAt` is nullable, and IndexedDB indexes silently drop records
    // whose indexed property is null (same caveat db.ts already calls out
    // for `isActive`/`deleted`) — so this filters in JS rather than
    // querying the `syncedAt` index for `null`.
    const pending = items
      .filter((item) => item.syncedAt === null)
      .sort((a, b) => a.enqueuedAt - b.enqueuedAt)

    for (const item of pending) {
      try {
        await syncOne(item, ownerId)
        await db.syncQueue.update(item.id, { syncedAt: Date.now(), lastError: null })
      } catch (error) {
        await db.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          lastError: describeError(error),
        })
        // Keep going — one bad row shouldn't block the rest of the queue.
      }
    }
  } finally {
    setSyncing(false)
  }
}

async function syncOne(item: SyncQueueItem, ownerId: string): Promise<void> {
  if (!supabase) return
  const table = TABLE_FOR[item.entityType]

  if (item.operation === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', item.entityId)
    if (error) throw error
    return
  }

  const row = await buildRow(item.entityType, item.entityId, ownerId)
  // The local record is already gone (nothing in this app hard-deletes
  // today, but stay defensive against it happening later) — nothing to
  // push, and nothing to retry either.
  if (!row) return

  const { error } = await supabase.from(table).upsert(row)
  if (error) throw error
}

async function buildRow(
  entityType: SyncEntityType,
  entityId: string,
  ownerId: string,
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case 'team': {
      const team = await db.teams.get(entityId)
      return team ? teamToRow(team, ownerId) : null
    }
    case 'player': {
      const player = await db.players.get(entityId)
      return player ? playerToRow(player) : null
    }
    case 'game': {
      const game = await db.games.get(entityId)
      return game ? gameToRow(game) : null
    }
    case 'statEvent': {
      const event = await db.statEvents.get(entityId)
      return event ? statEventToRow(event) : null
    }
  }
}

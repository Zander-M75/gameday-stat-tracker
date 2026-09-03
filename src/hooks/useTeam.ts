import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '../db/db'
import { getOrCreateTeam } from '../db/queries'
import type { Team } from '../db/types'

/**
 * The single team record, lazily created on first use. Undefined while
 * loading.
 *
 * The read and the create are split on purpose: Dexie's `liveQuery` (what
 * `useLiveQuery` subscribes through) requires its querier to be read-only —
 * calling `getOrCreateTeam()` directly as the querier throws `ReadOnlyError`
 * on a brand-new database, where it needs to write the first `Team` row,
 * which crashes the page with no error boundary to catch it. So the write
 * happens once in an effect, outside the live-query context, while the
 * query itself only ever reads.
 */
export function useTeam(): Team | undefined {
  useEffect(() => {
    void getOrCreateTeam()
  }, [])
  return useLiveQuery(() => db.teams.toCollection().first(), [])
}

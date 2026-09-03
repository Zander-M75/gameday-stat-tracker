import { useLiveQuery } from 'dexie-react-hooks'
import { getOrCreateTeam } from '../db/queries'
import type { Team } from '../db/types'

/** The single team record, lazily created on first use. Undefined while loading. */
export function useTeam(): Team | undefined {
  return useLiveQuery(() => getOrCreateTeam(), [])
}

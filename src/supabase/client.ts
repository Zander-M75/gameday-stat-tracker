import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * `null` whenever the app hasn't been given Supabase credentials — e.g. every
 * build until someone fills in `.env` from `.env.example`. Every call site
 * must treat that as "cloud features unavailable" and degrade quietly, never
 * throw: this is the same "fully functional with the network off" rule from
 * CLAUDE.md, just extended to "fully functional with no cloud project
 * configured at all," since auth/sync are additive on top of the local-first
 * app, not a requirement to use it.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

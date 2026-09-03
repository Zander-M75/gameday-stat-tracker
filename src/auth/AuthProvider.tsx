import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { flushSyncQueue } from '../sync/syncEngine'
import { supabase } from '../supabase/client'

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-in' | 'signed-out'

interface AuthContextValue {
  session: Session | null
  status: AuthStatus
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Wraps the whole app (see main.tsx) but nothing downstream ever gates on
 * being signed in — the app must stay fully usable offline/unauthenticated
 * regardless of auth state. `flushSyncQueue` (phase 8) reads the live
 * session for itself via `supabase.auth.getSession()` rather than pulling it
 * from this context, since it's a plain module, not a component — this
 * provider's session state is for UI (the account page) only.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'unconfigured')

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setStatus(data.session ? 'signed-in' : 'signed-out')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'signed-in' : 'signed-out')
      // A backlog may have built up while signed out (or before this magic
      // link was clicked) — nudge a flush right away instead of waiting on
      // useSyncEngine's interval.
      if (newSession) void flushSyncQueue()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: 'Cloud sync is not configured for this build.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, status, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

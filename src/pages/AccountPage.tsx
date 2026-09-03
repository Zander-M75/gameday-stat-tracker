import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const inputClasses =
  'h-14 min-w-0 rounded-md border border-border bg-surface px-3 text-text focus:border-accent focus:outline-none'

/**
 * Not part of the primary Roster/Games/Season nav (see Sidebar/AccountButton)
 * — auth is additive on top of the local-first app, never a gate. Phase 7 is
 * schema + auth only, no sync wired up yet, so signing in here doesn't do
 * anything to the coach's data yet beyond establishing a session.
 */
export function AccountPage() {
  const { status, session, signInWithEmail, signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 md:p-8">
      <div>
        <Link to="/games" className="text-sm font-medium text-text-muted hover:text-text">
          ← Games
        </Link>
        <h1 className="text-2xl font-bold text-text">Account</h1>
      </div>

      <div className="max-w-sm">
        {status === 'unconfigured' && <UnconfiguredNotice />}
        {status === 'loading' && <p className="text-text-muted">Loading…</p>}
        {status === 'signed-out' && <SignInForm onSignIn={signInWithEmail} />}
        {status === 'signed-in' && session && (
          <SignedIn email={session.user.email ?? 'Unknown'} onSignOut={() => void signOut()} />
        )}
      </div>
    </div>
  )
}

function UnconfiguredNotice() {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4 text-sm text-text-muted">
      <p className="font-semibold text-text">Cloud sync isn't set up for this build.</p>
      <p className="mt-2">
        Everything still works fully offline. To enable cross-device sync, create a Supabase project
        and copy its URL and anon key into a local <code className="text-text">.env</code> file (see{' '}
        <code className="text-text">.env.example</code>).
      </p>
    </div>
  )
}

function SignInForm({
  onSignIn,
}: {
  onSignIn: (email: string) => Promise<{ error: string | null }>
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState('sending')
    setError(null)
    const { error } = await onSignIn(email.trim())
    if (error) {
      setError(error)
      setState('idle')
    } else {
      setState('sent')
    }
  }

  if (state === 'sent') {
    return (
      <p className="rounded-lg border border-border bg-surface-raised p-4 text-sm text-text">
        Check <span className="font-semibold">{email}</span> for a sign-in link.
      </p>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Sign in with a magic link — no password to remember on the sideline.
      </p>
      <label htmlFor="email" className="flex flex-col gap-1 text-xs font-medium text-text-muted">
        Email
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </label>
      <button
        type="submit"
        disabled={state === 'sending'}
        className="flex min-h-14 items-center justify-center rounded-md bg-accent px-4 font-semibold text-accent-contrast disabled:opacity-40"
      >
        {state === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}

function SignedIn({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4">
      <p className="text-sm text-text-muted">
        Signed in as <span className="font-semibold text-text">{email}</span>
      </p>
      <button
        type="button"
        onClick={onSignOut}
        className="flex min-h-14 items-center justify-center rounded-md border border-border px-4 font-semibold text-text"
      >
        Sign out
      </button>
    </div>
  )
}

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches a render error in whatever screen is currently mounted, so a bug
 * on one page can't take down the whole app. `AppShell` wraps only the
 * routed page content in this (not its own nav chrome), and keys it by the
 * current path — so navigating away via the sidebar/bottom tab bar (still
 * interactive, since it's outside this boundary) mounts a fresh instance
 * with no memory of the earlier crash, rather than getting stuck showing
 * the fallback forever. "Try again" covers the same-route case: whatever
 * transient state caused the throw might not reproduce on a second render.
 *
 * Nothing is actually at risk here — every write already lands in
 * IndexedDB before it could reach a render error (see db/types.ts's note
 * on the event log being the source of truth), so a reload just re-reads
 * the same data.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <h1 className="text-xl font-bold text-text">Something went wrong</h1>
          <p className="max-w-sm text-sm text-text-muted">
            This screen hit an error. Your data is saved locally and wasn&rsquo;t affected — try
            again, or use the nav to go somewhere else.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="flex min-h-14 items-center rounded-md border border-border px-4 text-sm font-semibold text-text xl:min-h-10"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { AccountButton } from './AccountButton'
import { BottomTabBar } from './BottomTabBar'
import { Sidebar } from './Sidebar'
import { StatusBadges } from './StatusBadges'
import { ErrorBoundary } from '../ErrorBoundary'

/**
 * Branches on breakpoint instead of stacking responsive classes on one layout:
 * the sidebar and bottom tab bar are different components with different
 * interaction models, not one nav bent two ways. Never both render at once.
 *
 * `StatusBadges` is `fixed`-positioned and renders nothing when there's
 * nothing to show, so it's mounted once here, above the branch, rather than
 * duplicated inside both. `AccountButton` only renders in the non-sidebar
 * branch — `Sidebar` already has its own Account link, so this avoids a
 * second entry point.
 *
 * `children` (the routed page) is wrapped in `ErrorBoundary`, not the nav
 * chrome around it — a crash on one screen shouldn't take the sidebar/tab
 * bar down with it. Keyed by `pathname` so navigating to a different route
 * mounts a fresh boundary instead of staying stuck on the last crash.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isDesktopNav } = useBreakpoint()
  const { pathname } = useLocation()
  const content = <ErrorBoundary key={pathname}>{children}</ErrorBoundary>

  return (
    <>
      <StatusBadges />
      {isDesktopNav ? (
        <div className="flex h-dvh w-dvw overflow-hidden">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">{content}</main>
        </div>
      ) : (
        <div className="flex h-dvh w-dvw flex-col overflow-hidden">
          <AccountButton />
          <main className="min-h-0 flex-1 overflow-y-auto">{content}</main>
          <BottomTabBar />
        </div>
      )}
    </>
  )
}

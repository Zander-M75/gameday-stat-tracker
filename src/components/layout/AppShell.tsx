import type { ReactNode } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { AccountButton } from './AccountButton'
import { BottomTabBar } from './BottomTabBar'
import { OfflineIndicator } from './OfflineIndicator'
import { Sidebar } from './Sidebar'

/**
 * Branches on breakpoint instead of stacking responsive classes on one layout:
 * the sidebar and bottom tab bar are different components with different
 * interaction models, not one nav bent two ways. Never both render at once.
 *
 * `OfflineIndicator` is `fixed`-positioned and renders nothing while online,
 * so it's mounted once here, above the branch, rather than duplicated inside
 * both. `AccountButton` only renders in the non-sidebar branch — `Sidebar`
 * already has its own Account link, so this avoids a second entry point.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isDesktopNav } = useBreakpoint()

  return (
    <>
      <OfflineIndicator />
      {isDesktopNav ? (
        <div className="flex h-dvh w-dvw overflow-hidden">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      ) : (
        <div className="flex h-dvh w-dvw flex-col overflow-hidden">
          <AccountButton />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          <BottomTabBar />
        </div>
      )}
    </>
  )
}

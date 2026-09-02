import type { ReactNode } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { BottomTabBar } from './BottomTabBar'
import { Sidebar } from './Sidebar'

/**
 * Branches on breakpoint instead of stacking responsive classes on one layout:
 * the sidebar and bottom tab bar are different components with different
 * interaction models, not one nav bent two ways. Never both render at once.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isDesktopNav } = useBreakpoint()

  if (isDesktopNav) {
    return (
      <div className="flex h-dvh w-dvw overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden">
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <BottomTabBar />
    </div>
  )
}

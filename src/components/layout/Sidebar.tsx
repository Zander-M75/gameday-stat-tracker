import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav-items'
import { ThemeToggle } from './ThemeToggle'

/** Persistent nav for iPad landscape and up (see useBreakpoint's isDesktopNav). */
export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="flex w-56 shrink-0 flex-col border-r border-border bg-surface-raised p-3"
    >
      <div className="px-2 py-3 text-lg font-bold tracking-tight text-text">Gameday</div>
      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-14 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                isActive
                  ? 'bg-surface-overlay text-accent'
                  : 'text-text-muted hover:bg-surface-overlay hover:text-text'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </div>
      <ThemeToggle />
    </nav>
  )
}

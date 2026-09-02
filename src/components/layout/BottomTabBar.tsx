import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav-items'

/** Phone and iPad-portrait nav. Fixed to the bottom so a thumb never has to travel far. */
export function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="flex shrink-0 border-t border-border bg-surface-raised pb-[env(safe-area-inset-bottom)]"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              isActive ? 'text-accent' : 'text-text-muted'
            }`
          }
        >
          <Icon className="size-6" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

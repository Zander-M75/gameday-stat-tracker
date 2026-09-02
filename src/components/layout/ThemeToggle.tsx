import { MoonIcon, SunIcon } from '../icons'
import { useTheme } from '../../theme/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-text-muted hover:bg-surface-overlay hover:text-text"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}

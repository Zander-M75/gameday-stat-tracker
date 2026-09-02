import { useSyncExternalStore } from 'react'

/** Mirrors Tailwind's default breakpoints so layout code and CSS agree on the same numbers. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type BreakpointName = keyof typeof BREAKPOINTS

/**
 * The nav switches at `lg` (1024px), not `md` (768px), on purpose: iPad portrait
 * (~768-834px wide) and iPad landscape (1024px+) both fall in the device spec's
 * "768 to 1024px, both orientations" bucket, but only landscape has room for a
 * persistent sidebar. Below 1024px wide (phone, and iPad held upright) gets the
 * bottom tab bar instead.
 */
const DESKTOP_NAV_MIN: BreakpointName = 'lg'

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

function getWidth() {
  return window.innerWidth
}

function getHeight() {
  return window.innerHeight
}

function nameForWidth(width: number): BreakpointName | 'base' {
  const entries = Object.entries(BREAKPOINTS) as [BreakpointName, number][]
  const match = entries.sort((a, b) => b[1] - a[1]).find(([, minWidth]) => width >= minWidth)
  return match ? match[0] : 'base'
}

export interface Breakpoint {
  name: BreakpointName | 'base'
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  /** True at `lg` and up: iPad landscape, laptop, desktop — gets the sidebar nav. */
  isDesktopNav: boolean
  isAtLeast: (breakpoint: BreakpointName) => boolean
}

export function useBreakpoint(): Breakpoint {
  const width = useSyncExternalStore(subscribe, getWidth)
  const height = useSyncExternalStore(subscribe, getHeight)

  const isAtLeast = (breakpoint: BreakpointName) => width >= BREAKPOINTS[breakpoint]

  return {
    name: nameForWidth(width),
    width,
    height,
    orientation: width >= height ? 'landscape' : 'portrait',
    isDesktopNav: isAtLeast(DESKTOP_NAV_MIN),
    isAtLeast,
  }
}

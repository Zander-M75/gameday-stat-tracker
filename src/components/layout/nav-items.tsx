import type { ComponentType, SVGProps } from 'react'
import { GamesIcon, RosterIcon, SeasonIcon } from '../icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/roster', label: 'Roster', icon: RosterIcon },
  { to: '/games', label: 'Games', icon: GamesIcon },
  { to: '/season', label: 'Season', icon: SeasonIcon },
]

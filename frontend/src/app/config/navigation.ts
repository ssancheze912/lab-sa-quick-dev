import type { ComponentType, SVGProps } from 'react'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export interface NavItem {
  id: string
  label: string
  path: '/clientes' | '/contactos'
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

/**
 * Shared navigation entries used by both the desktop NavigationRail and
 * the mobile NavigationBar. Labels are in Spanish per company standard.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'clientes', label: 'Clientes', path: '/clientes', Icon: UsersIcon },
  { id: 'contactos', label: 'Contactos', path: '/contactos', Icon: UserIcon },
] as const

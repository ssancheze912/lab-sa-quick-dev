import { LayoutBase } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import { UsersIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { useActiveNav } from './useActiveNav'
import type { NavId } from './useActiveNav'

interface AppShellProps {
  children: ReactNode
}

/**
 * Desktop shell (>= lg: 1024px) composed with siesa-ui-kit's `LayoutBase`
 * which internally renders Navbar + NavigationRailGroup. Item click delegates
 * to TanStack Router (SPA navigation — never `window.location`).
 */
export function AppShell({ children }: AppShellProps) {
  const { activeId, navigate } = useActiveNav()

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      active: activeId === 'clientes',
      icon: (
        <span
          data-testid="nav-item-clientes"
          data-active={activeId === 'clientes' ? 'true' : 'false'}
          className="inline-flex h-4 w-4 items-center justify-center"
        >
          <UsersIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      ),
      onClick: () => navigate('clientes' as NavId),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      active: activeId === 'contactos',
      icon: (
        <span
          data-testid="nav-item-contactos"
          data-active={activeId === 'contactos' ? 'true' : 'false'}
          className="inline-flex h-4 w-4 items-center justify-center"
        >
          <IdentificationIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      ),
      onClick: () => navigate('contactos' as NavId),
    },
  ]

  return (
    <LayoutBase
      productName="Siesa Agents"
      locale="es"
      navigationItems={navigationItems}
      navigationRailProps={{ state: 'collapsed' }}
    >
      {children}
    </LayoutBase>
  )
}

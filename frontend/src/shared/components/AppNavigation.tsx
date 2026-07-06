import type { ReactNode } from 'react'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'
import { NavigationBar, NavigationRail } from 'siesa-ui-kit'
import { HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline'

type AppRoutePath = '/clientes' | '/contactos'

interface AppNavItem {
  id: string
  label: string
  icon: ReactNode
  path: AppRoutePath
}

/**
 * Shared nav-items source of truth (Story 1.2, Task 2).
 * Both NavigationRail (desktop) and NavigationBar (mobile) are built from this
 * single array plus one useMatchRoute() result, so route-matching logic is never duplicated.
 */
const NAV_ITEMS: AppNavItem[] = [
  { id: 'clientes', label: 'Clientes', icon: <HomeIcon className="h-6 w-6" />, path: '/clientes' },
  { id: 'contactos', label: 'Contactos', icon: <UserGroupIcon className="h-6 w-6" />, path: '/contactos' },
]

export function AppNavigation() {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()

  const activeId = NAV_ITEMS.find((item) => matchRoute({ to: item.path }))?.id

  const handleSelect = (id: string) => {
    const item = NAV_ITEMS.find((navItem) => navItem.id === id)
    if (item) navigate({ to: item.path })
  }

  return (
    <>
      <div data-testid="nav-rail-container" className="hidden lg:flex">
        <NavigationRail
          items={NAV_ITEMS.map(({ id, label, icon }) => ({
            id,
            label,
            icon,
            ariaLabel: label,
          }))}
          selectedId={activeId}
          onItemSelect={handleSelect}
        />
      </div>
      <div data-testid="nav-bar-container" className="lg:hidden">
        <NavigationBar
          items={NAV_ITEMS.map(({ id, label, icon }) => ({
            id,
            label,
            icon,
            ariaLabel: label,
          }))}
          activeItemId={activeId}
          onItemClick={handleSelect}
        />
      </div>
    </>
  )
}

import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import type { NavigationRailItemProps } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'

const NAV_CLIENTES = 'clientes'
const NAV_CONTACTOS = 'contactos'

export function AppShell() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const activeId = currentPath.startsWith('/contactos') ? NAV_CONTACTOS : NAV_CLIENTES

  const railItems: NavigationRailItemProps[] = [
    {
      id: NAV_CLIENTES,
      icon: <UserGroupIcon className="w-6 h-6" />,
      label: 'Clientes',
      selected: activeId === NAV_CLIENTES,
      ariaLabel: 'Clientes',
    },
    {
      id: NAV_CONTACTOS,
      icon: <UserIcon className="w-6 h-6" />,
      label: 'Contactos',
      selected: activeId === NAV_CONTACTOS,
      ariaLabel: 'Contactos',
    },
  ]

  const barItems: NavigationBarItem[] = [
    {
      id: NAV_CLIENTES,
      icon: <UserGroupIcon className="w-4 h-4" />,
      label: 'Clientes',
      active: activeId === NAV_CLIENTES,
      ariaLabel: 'Clientes',
    },
    {
      id: NAV_CONTACTOS,
      icon: <UserIcon className="w-4 h-4" />,
      label: 'Contactos',
      active: activeId === NAV_CONTACTOS,
      ariaLabel: 'Contactos',
    },
  ]

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail (hidden on mobile) */}
      <nav aria-label="Navegación principal" className="hidden lg:flex">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={(id) => {
            const el = document.querySelector<HTMLAnchorElement>(`[data-nav-id="${id}"]`)
            if (el) el.click()
          }}
        />
        {/* Hidden links for programmatic navigation */}
        <div className="hidden">
          <Link to="/clientes" data-nav-id={NAV_CLIENTES} aria-current={activeId === NAV_CLIENTES ? 'page' : undefined} />
          <Link to="/contactos" data-nav-id={NAV_CONTACTOS} aria-current={activeId === NAV_CONTACTOS ? 'page' : undefined} />
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar (hidden on desktop) */}
      <nav aria-label="Navegación principal" className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={(id) => {
            const el = document.querySelector<HTMLAnchorElement>(`[data-nav-bar-id="${id}"]`)
            if (el) el.click()
          }}
        />
        {/* Hidden links for programmatic navigation */}
        <div className="hidden">
          <Link to="/clientes" data-nav-bar-id={NAV_CLIENTES} aria-current={activeId === NAV_CLIENTES ? 'page' : undefined} />
          <Link to="/contactos" data-nav-bar-id={NAV_CONTACTOS} aria-current={activeId === NAV_CONTACTOS ? 'page' : undefined} />
        </div>
      </nav>
    </div>
  )
}

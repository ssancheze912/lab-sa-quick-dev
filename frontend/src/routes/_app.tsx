import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

export function AppLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-5 w-5" />,
      active: currentPath === '/clientes',
      onClick: () => window.location.assign('/clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-5 w-5" />,
      active: currentPath === '/contactos',
      onClick: () => window.location.assign('/contactos'),
    },
  ]

  const mobileNavItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-6 w-6" />,
      active: currentPath === '/clientes',
      ariaLabel: 'Clientes',
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-6 w-6" />,
      active: currentPath === '/contactos',
      ariaLabel: 'Contactos',
    },
  ]

  return (
    <>
      {/* Desktop layout: LayoutBase with NavigationRail (hidden on mobile via CSS) */}
      <div className="hidden lg:flex h-screen" data-testid="navigation-rail">
        <LayoutBase
          productName="Siesa Agents"
          navigationItems={navigationItems}
        >
          <AppNavItems currentPath={currentPath} />
          <Outlet />
        </LayoutBase>
      </div>

      {/* Mobile layout: NavigationBar at bottom (hidden on desktop via CSS) */}
      <div className="flex lg:hidden flex-col h-screen" data-testid="navigation-bar">
        <main className="flex-1 overflow-auto p-4">
          <AppNavItems currentPath={currentPath} />
          <Outlet />
        </main>
        <NavigationBar
          items={mobileNavItems}
          activeItemId={currentPath === '/clientes' ? 'clientes' : currentPath === '/contactos' ? 'contactos' : undefined}
        />
      </div>
    </>
  )
}

interface AppNavItemsProps {
  currentPath: string
}

function AppNavItems({ currentPath }: AppNavItemsProps) {
  return (
    <nav aria-label="Navegación principal" className="hidden">
      <Link
        to="/clientes"
        data-testid="nav-item-clientes"
        data-active={currentPath === '/clientes' ? 'true' : undefined}
        aria-label="Clientes"
        aria-current={currentPath === '/clientes' ? 'page' : undefined}
      >
        Clientes
      </Link>
      <Link
        to="/contactos"
        data-testid="nav-item-contactos"
        data-active={currentPath === '/contactos' ? 'true' : undefined}
        aria-label="Contactos"
        aria-current={currentPath === '/contactos' ? 'page' : undefined}
      >
        Contactos
      </Link>
    </nav>
  )
}

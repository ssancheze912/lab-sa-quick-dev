import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import { Navbar, NavigationRailItem, NavigationBar } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'
import { NotFound } from '@/shared/components/NotFound'

function RootLayout() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navigationBarItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserGroupIcon className="size-6" />,
      active: currentPath === '/clientes',
      ariaLabel: 'Clientes',
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-6" />,
      active: currentPath === '/contactos',
      ariaLabel: 'Contactos',
    },
  ]

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Navbar */}
      <Navbar productName="Siesa Agents" />

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop NavigationRail — hidden on mobile */}
        <nav
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          className="hidden lg:flex flex-col items-center py-2 w-[72px] shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800"
        >
          <div
            data-testid="nav-item-clientes"
            aria-current={currentPath === '/clientes' ? 'page' : undefined}
          >
            <NavigationRailItem
              id="clientes"
              label="Clientes"
              icon={<UserGroupIcon className="size-4" />}
              selected={currentPath === '/clientes'}
              onClick={() => void navigate({ to: '/clientes' })}
              ariaLabel="Clientes"
            />
          </div>
          <div
            data-testid="nav-item-contactos"
            aria-current={currentPath === '/contactos' ? 'page' : undefined}
          >
            <NavigationRailItem
              id="contactos"
              label="Contactos"
              icon={<UserIcon className="size-4" />}
              selected={currentPath === '/contactos'}
              onClick={() => void navigate({ to: '/contactos' })}
              ariaLabel="Contactos"
            />
          </div>
        </nav>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile NavigationBar — visible on mobile (< 1024px), hidden on desktop */}
      <NavigationBar
        items={navigationBarItems}
        activeItemId={currentPath.replace('/', '')}
        onItemClick={(id) => void navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
        className="flex lg:hidden"
        ariaLabel="Navegación principal"
      />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem, NavigationBarItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

function AppShell() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const activeId = pathname.startsWith('/contactos') ? 'contactos' : 'clientes'

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" aria-label="Clientes" />,
      active: activeId === 'clientes',
      onClick: () => { void navigate({ to: '/clientes' }) },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" aria-label="Contactos" />,
      active: activeId === 'contactos',
      onClick: () => { void navigate({ to: '/contactos' }) },
    },
  ]

  const mobileNavItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" />,
      active: activeId === 'clientes',
      ariaLabel: 'Clientes',
      onClick: (id: string) => { void navigate({ to: `/${id}` }) },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" />,
      active: activeId === 'contactos',
      ariaLabel: 'Contactos',
      onClick: (id: string) => { void navigate({ to: `/${id}` }) },
    },
  ]

  return (
    <div data-testid="app-shell" className="flex flex-col min-h-screen">
      <div className="hidden lg:flex flex-1">
        <LayoutBase
          productName="Siesa Agents"
          navigationItems={navigationItems}
        >
          <nav aria-label="Navegación principal" className="contents">
            <Outlet />
          </nav>
        </LayoutBase>
      </div>

      <div className="flex lg:hidden flex-col flex-1">
        <main className="flex-1 p-4">
          <Outlet />
        </main>
        <nav aria-label="Navegación principal">
          <NavigationBar
            items={mobileNavItems}
            activeItemId={activeId}
            onItemClick={(id: string) => { void navigate({ to: `/${id}` }) }}
            ariaLabel="Navegación principal"
          />
        </nav>
      </div>
    </div>
  )
}

import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailItemProps } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'
import { UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

const NAV_ROUTES: Record<string, string> = {
  clientes: '/clientes',
  contactos: '/contactos',
}

function AppShell() {
  const navigate = useNavigate()
  const { location } = useRouterState()

  const activeId = location.pathname.startsWith('/contactos')
    ? 'contactos'
    : 'clientes'

  const railItems: NavigationRailItemProps[] = [
    {
      id: 'clientes',
      icon: <UserGroupIcon className="w-6 h-6" />,
      label: 'Clientes',
      selected: activeId === 'clientes',
      ariaLabel: 'Clientes',
    },
    {
      id: 'contactos',
      icon: <IdentificationIcon className="w-6 h-6" />,
      label: 'Contactos',
      selected: activeId === 'contactos',
      ariaLabel: 'Contactos',
    },
  ]

  const barItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      icon: <UserGroupIcon className="w-6 h-6" />,
      label: 'Clientes',
      active: activeId === 'clientes',
      ariaLabel: 'Clientes',
    },
    {
      id: 'contactos',
      icon: <IdentificationIcon className="w-6 h-6" />,
      label: 'Contactos',
      active: activeId === 'contactos',
      ariaLabel: 'Contactos',
    },
  ]

  const handleNavSelect = (id: string) => {
    const route = NAV_ROUTES[id]
    if (route) {
      void navigate({ to: route })
    }
  }

  return (
    <div className="flex flex-row h-screen bg-white dark:bg-slate-950">
      {/* Desktop: NavigationRail on left */}
      <nav
        aria-label="Navegación principal"
        className="hidden lg:flex flex-col"
      >
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={handleNavSelect}
        />
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at bottom */}
      <nav
        aria-label="Navegación principal"
        className="flex lg:hidden fixed bottom-0 w-full z-50"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={handleNavSelect}
          ariaLabel="Navegación principal"
          className="w-full"
        />
      </nav>
    </div>
  )
}

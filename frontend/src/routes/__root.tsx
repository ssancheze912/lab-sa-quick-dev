import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'

interface NavItemConfig {
  id: string
  label: string
  to: string
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'clientes', label: 'Clientes', to: '/clientes' },
  { id: 'contactos', label: 'Contactos', to: '/contactos' },
]

function RootLayout() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const activeId = NAV_ITEMS.find((item) =>
    currentPath.startsWith(item.to),
  )?.id

  const railItems = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: null as React.ReactNode,
    selected: item.id === activeId,
    ariaLabel: item.label,
  }))

  const barItems: NavigationBarItem[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: null as React.ReactNode,
    active: item.id === activeId,
    ariaLabel: item.label,
  }))

  function handleRailSelect(id: string) {
    const item = NAV_ITEMS.find((n) => n.id === id)
    if (item) {
      void navigate({ to: item.to })
    }
  }

  function handleBarClick(id: string) {
    const item = NAV_ITEMS.find((n) => n.id === id)
    if (item) {
      void navigate({ to: item.to })
    }
  }

  return (
    <div className="flex h-screen" data-testid="app-root">
      {/* Desktop: NavigationRail on left */}
      <nav aria-label="Navegación principal" className="hidden lg:flex">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={handleRailSelect}
        />
      </nav>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {/* Mobile: NavigationBar at bottom */}
      <nav
        aria-label="Navegación principal"
        className="flex lg:hidden fixed bottom-0 w-full"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={handleBarClick}
          ariaLabel="Navegación principal"
        />
      </nav>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div
      role="main"
      className="flex flex-col items-center justify-center h-screen p-8 text-center"
    >
      <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
      <p className="text-gray-600">La página que buscas no existe.</p>
      <Link
        to="/clientes"
        className="mt-6 text-blue-600 hover:underline focus:ring-2 focus:ring-blue-500"
      >
        Ir a Clientes
      </Link>
    </div>
  ),
})

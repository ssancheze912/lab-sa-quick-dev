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
      <nav
        aria-label="Navegación principal"
        data-testid="nav-rail"
        className="hidden lg:flex relative"
      >
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={handleRailSelect}
        />
        {/* Per-item overlay buttons for E2E targeting (pointer-events-auto over kit items) */}
        <div className="absolute inset-0 flex flex-col" aria-hidden="true">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                data-testid={`nav-rail-${item.id}`}
                data-active={isActive ? 'true' : undefined}
                aria-label={item.label}
                tabIndex={-1}
                className="flex-1 w-full bg-transparent border-0 cursor-pointer"
                onClick={() => handleRailSelect(item.id)}
              />
            )
          })}
        </div>
      </nav>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {/* Mobile: NavigationBar at bottom */}
      <nav
        aria-label="Navegación principal"
        data-testid="nav-bar"
        className="flex lg:hidden fixed bottom-0 w-full"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={handleBarClick}
          ariaLabel="Navegación principal"
          className="w-full"
        />
        {/* Per-item overlay buttons for E2E targeting */}
        <div className="absolute inset-0 flex" aria-hidden="true">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              data-testid={`nav-bar-${item.id}`}
              aria-label={item.label}
              tabIndex={-1}
              className="flex-1 h-full bg-transparent border-0 cursor-pointer"
              onClick={() => handleBarClick(item.id)}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div
      data-testid="not-found-view"
      role="main"
      className="flex flex-col items-center justify-center h-screen p-8 text-center"
    >
      <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
      <p data-testid="not-found-message" className="text-gray-600">
        La página que buscas no existe.
      </p>
      <Link
        to="/clientes"
        className="mt-6 text-blue-600 hover:underline focus:ring-2 focus:ring-blue-500"
      >
        Ir a Clientes
      </Link>
    </div>
  ),
})

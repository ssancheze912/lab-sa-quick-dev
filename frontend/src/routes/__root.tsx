import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { useNavigate } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

const NAV_ITEMS = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UserGroupIcon className="w-6 h-6" aria-hidden="true" />,
    ariaLabel: 'Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <IdentificationIcon className="w-6 h-6" aria-hidden="true" />,
    ariaLabel: 'Contactos',
  },
]

function RootLayout() {
  const { location } = useRouterState()
  const navigate = useNavigate()

  const activeId = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  )?.id

  const railItems = NAV_ITEMS.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    selected: activeId === item.id,
    ariaLabel: item.ariaLabel,
    onClick: () => void navigate({ to: item.to }),
  }))

  const barItems = NAV_ITEMS.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    active: activeId === item.id,
    ariaLabel: item.ariaLabel,
    onClick: (id: string) => {
      const navItem = NAV_ITEMS.find((n) => n.id === id)
      if (navItem) void navigate({ to: navItem.to })
    },
  }))

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail visible on lg+ screens */}
      <div
        className="hidden lg:flex"
        data-testid="navigation-rail-wrapper"
      >
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={(id) => {
            const navItem = NAV_ITEMS.find((n) => n.id === id)
            if (navItem) void navigate({ to: navItem.to })
          }}
        />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar visible below lg screens */}
      <div
        className="flex lg:hidden fixed bottom-0 w-full"
        data-testid="navigation-bar-wrapper"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={(id) => {
            const navItem = NAV_ITEMS.find((n) => n.id === id)
            if (navItem) void navigate({ to: navItem.to })
          }}
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-600">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        className="text-[#0e79fd] hover:underline font-medium"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}

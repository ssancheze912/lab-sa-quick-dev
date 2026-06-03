import { createRootRoute, Outlet, Link, useRouter } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

type NavItemDef = {
  id: string
  label: string
  path: string
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'clientes', label: 'Clientes', path: '/clientes' },
  { id: 'contactos', label: 'Contactos', path: '/contactos' },
]

function RootLayout() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const activeItemId = currentPath.startsWith('/contactos')
    ? 'contactos'
    : currentPath.startsWith('/clientes')
      ? 'clientes'
      : undefined

  const railItems = NAV_ITEMS.map((item) => ({
    id: item.id,
    icon: item.id === 'clientes'
      ? <UserGroupIcon className="w-6 h-6" />
      : <UserIcon className="w-6 h-6" />,
    label: item.label,
    selected: item.id === activeItemId,
    onClick: () => router.navigate({ to: item.path }),
    ariaLabel: `Ir a ${item.label}`,
  }))

  const barItems = NAV_ITEMS.map((item) => ({
    id: item.id,
    icon: item.id === 'clientes'
      ? <UserGroupIcon className="w-4 h-4" />
      : <UserIcon className="w-4 h-4" />,
    label: item.label,
    active: item.id === activeItemId,
    onClick: () => router.navigate({ to: item.path }),
    ariaLabel: `Ir a ${item.label}`,
  }))

  return (
    <div className="flex h-screen">
      {/* Accessible nav anchors — used for testing and assistive tech */}
      <nav className="sr-only" aria-label="Accesos de navegación">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.path}
            data-testid={`nav-item-${item.id}`}
            aria-current={item.id === activeItemId ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              router.navigate({ to: item.path })
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Desktop NavigationRail — hidden on mobile */}
      <div
        className="hidden lg:flex"
        data-testid="navigation-rail"
        role="navigation"
        aria-label="Navegación principal"
      >
        <NavigationRail
          items={railItems}
          selectedId={activeItemId}
          onItemSelect={(id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)
            if (item) router.navigate({ to: item.path })
          }}
        />
      </div>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile NavigationBar — hidden on desktop */}
      <div
        className="flex lg:hidden fixed bottom-0 w-full z-50"
        data-testid="navigation-bar"
        role="navigation"
        aria-label="Navegación móvil"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeItemId}
          onItemClick={(id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)
            if (item) router.navigate({ to: item.path })
          }}
          className="w-full"
        />
      </div>
    </div>
  )
}

function NotFoundView() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 min-h-screen"
      data-testid="not-found-view"
    >
      <h1
        className="text-2xl font-bold text-slate-800"
        data-testid="not-found-message"
      >
        Página no encontrada
      </h1>
      <p className="text-slate-500">La ruta solicitada no existe.</p>
      <Link
        to="/clientes"
        className="px-4 py-2 bg-[#0e79fd] text-white rounded-md hover:bg-[#154ca9] transition-colors"
        data-testid="not-found-back-link"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}

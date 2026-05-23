import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

const NAV_ITEMS = [
  { id: 'clientes', label: 'Clientes', icon: <UsersIcon className="w-5 h-5" />, to: '/clientes' },
  { id: 'contactos', label: 'Contactos', icon: <UserIcon className="w-5 h-5" />, to: '/contactos' },
]

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const navigate = useNavigate()

  const navigationItems = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: currentPath.startsWith(item.to),
    onClick: () => void navigate({ to: item.to }),
  }))

  return (
    <LayoutBase
      productName="SA Quick Dev"
      navigationItems={navigationItems}
      navigationRailProps={{
        onItemClick: (item) => {
          const found = NAV_ITEMS.find((n) => n.id === item.id)
          if (found) void navigate({ to: found.to })
        },
      }}
    >
      {/* Accessible nav landmark with WCAG 2.1 AA compliant links */}
      <nav aria-label="Navegación principal" className="sr-only" data-testid="nav-shell">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            aria-label={`Ir a ${item.label}`}
            activeProps={{ className: 'active' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </LayoutBase>
  )
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
      <h1 className="text-4xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="text-base text-slate-500">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        className="text-blue-600 hover:underline font-medium"
      >
        ← Ir a Clientes
      </Link>
    </div>
  )
}

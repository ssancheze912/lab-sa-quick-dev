import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

// Navigation items definition
const NAV_ITEMS = [
  {
    id: 'clientes',
    label: 'Clientes',
    Icon: UsersIcon,
    to: '/clientes' as const,
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    Icon: UserIcon,
    to: '/contactos' as const,
    ariaLabel: 'Ir a Contactos',
  },
]

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <div className="flex flex-col min-h-screen">
      {/* Desktop layout: NavigationRail on the left */}
      <div className="flex flex-1">
        {/* NavigationRail — visible on desktop (lg+), hidden on mobile */}
        <nav
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          className="hidden lg:flex flex-col w-[72px] min-h-screen bg-slate-900 items-center py-4 gap-2 shrink-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.to)
            return (
              <Link
                key={item.id}
                to={item.to}
                data-testid={`nav-item-${item.id}`}
                data-active={String(isActive)}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white',
                ].join(' ')}
              >
                <item.Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] mt-1 leading-none">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Main content area */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* NavigationBar — visible on mobile, hidden on desktop (lg+) */}
      <nav
        data-testid="navigation-bar"
        aria-label="Navegación principal móvil"
        className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath.startsWith(item.to)
          return (
            <Link
              key={item.id}
              to={item.to}
              data-testid={`nav-item-${item.id}`}
              data-active={String(isActive)}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-col items-center justify-center flex-1 min-h-[56px] py-2 transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
              ].join(' ')}
            >
              <item.Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs mt-1 leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6"
    >
      <h1
        data-testid="not-found-title"
        className="text-4xl font-bold tracking-tight"
      >
        Página no encontrada
      </h1>
      <p className="text-base text-slate-500">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="text-blue-600 hover:underline font-medium"
      >
        ← Ir a Clientes
      </Link>
    </div>
  )
}

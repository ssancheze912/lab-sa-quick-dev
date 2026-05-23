import React from 'react'
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

// Hook para detectar mobile (breakpoint < 768px)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col min-h-screen">
      {isMobile ? (
        /* NavigationBar — solo en mobile, único componente de nav en el DOM */
        <>
          <div className="flex flex-1">
            <main className="flex-1 flex flex-col pb-14">
              <Outlet />
            </main>
          </div>
          <nav
            data-testid="navigation-bar"
            aria-label="Navegación principal móvil"
            className="flex fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50"
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
        </>
      ) : (
        /* NavigationRail — solo en desktop, único componente de nav en el DOM */
        <div className="flex flex-1">
          <nav
            data-testid="navigation-rail"
            aria-label="Navegación principal"
            className="flex flex-col w-[72px] min-h-screen bg-slate-900 items-center py-4 gap-2 shrink-0"
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

          <main className="flex-1 flex flex-col">
            <Outlet />
          </main>
        </div>
      )}
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

import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

export function AppLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const isClientes = currentPath === '/clientes' || currentPath.startsWith('/clientes/')
  const isContactos = currentPath === '/contactos' || currentPath.startsWith('/contactos/')

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {isDesktop && (
          <nav
            data-testid="navigation-rail"
            aria-label="Navegación principal"
            className="flex flex-col w-20 bg-white border-r border-slate-200 shrink-0"
          >
            <Link
              to="/clientes"
              data-testid="nav-item-clientes"
              data-active={isClientes ? 'true' : undefined}
              aria-label="Clientes"
              aria-current={isClientes ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 py-4 min-h-[56px] text-xs text-slate-600 hover:bg-slate-50 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600"
            >
              <UsersIcon className="h-6 w-6" />
              <span>Clientes</span>
            </Link>
            <Link
              to="/contactos"
              data-testid="nav-item-contactos"
              data-active={isContactos ? 'true' : undefined}
              aria-label="Contactos"
              aria-current={isContactos ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 py-4 min-h-[56px] text-xs text-slate-600 hover:bg-slate-50 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600"
            >
              <UserIcon className="h-6 w-6" />
              <span>Contactos</span>
            </Link>
          </nav>
        )}

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {!isDesktop && (
        <nav
          data-testid="navigation-bar"
          aria-label="Navegación principal móvil"
          className="flex border-t border-slate-200 bg-white shrink-0"
        >
          <Link
            to="/clientes"
            data-testid="nav-item-clientes"
            data-active={isClientes ? 'true' : undefined}
            aria-label="Clientes"
            aria-current={isClientes ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs text-slate-600 hover:bg-slate-50 data-[active=true]:text-blue-600"
          >
            <UsersIcon className="h-6 w-6" />
            <span>Clientes</span>
          </Link>
          <Link
            to="/contactos"
            data-testid="nav-item-contactos"
            data-active={isContactos ? 'true' : undefined}
            aria-label="Contactos"
            aria-current={isContactos ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs text-slate-600 hover:bg-slate-50 data-[active=true]:text-blue-600"
          >
            <UserIcon className="h-6 w-6" />
            <span>Contactos</span>
          </Link>
        </nav>
      )}
    </div>
  )
}

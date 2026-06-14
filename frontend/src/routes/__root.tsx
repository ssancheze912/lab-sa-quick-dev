import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  const { location } = useRouterState()
  const currentPath = location.pathname

  const isClientesActive = currentPath.startsWith('/clientes')
  const isContactosActive = currentPath.startsWith('/contactos')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar productName="Siesa Agents" />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop NavigationRail — hidden on mobile (lg:block hidden) */}
        <nav
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          className="hidden lg:flex flex-col w-[72px] border-r border-slate-200 bg-white py-4 gap-1 items-center"
        >
          <Link
            to="/clientes"
            data-testid="nav-item-clientes"
            data-active={isClientesActive ? 'true' : 'false'}
            aria-label="Clientes"
            aria-current={isClientesActive ? 'page' : undefined}
            className={[
              'flex flex-col items-center gap-1 w-14 px-0.5 py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2',
              isClientesActive
                ? 'text-[#0e79fd] bg-primary-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            ].join(' ')}
          >
            <UsersIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold leading-3">Clientes</span>
          </Link>

          <Link
            to="/contactos"
            data-testid="nav-item-contactos"
            data-active={isContactosActive ? 'true' : 'false'}
            aria-label="Contactos"
            aria-current={isContactosActive ? 'page' : undefined}
            className={[
              'flex flex-col items-center gap-1 w-14 px-0.5 py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2',
              isContactosActive
                ? 'text-[#0e79fd] bg-primary-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            ].join(' ')}
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold leading-3">Contactos</span>
          </Link>
        </nav>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile NavigationBar — visible only on mobile (lg:hidden) */}
      <nav
        data-testid="navigation-bar"
        aria-label="Navegación principal"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-white border-t border-slate-200"
      >
        <Link
          to="/clientes"
          data-testid="nav-bar-item-clientes"
          data-active={isClientesActive ? 'true' : 'false'}
          aria-label="Clientes"
          aria-current={isClientesActive ? 'page' : undefined}
          className={[
            'flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-inset',
            isClientesActive
              ? 'text-[#0e79fd]'
              : 'text-slate-600 hover:text-slate-900',
          ].join(' ')}
        >
          <UsersIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold leading-3">Clientes</span>
        </Link>

        <Link
          to="/contactos"
          data-testid="nav-bar-item-contactos"
          data-active={isContactosActive ? 'true' : 'false'}
          aria-label="Contactos"
          aria-current={isContactosActive ? 'page' : undefined}
          className={[
            'flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-inset',
            isContactosActive
              ? 'text-[#0e79fd]'
              : 'text-slate-600 hover:text-slate-900',
          ].join(' ')}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold leading-3">Contactos</span>
        </Link>
      </nav>
    </div>
  )
}

function NotFoundView() {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4"
    >
      <h1
        data-testid="not-found-heading"
        className="text-3xl font-bold text-slate-800"
      >
        Página no encontrada
      </h1>
      <p className="text-slate-600 max-w-md">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link
        data-testid="not-found-back-link"
        to="/clientes"
        className="inline-flex items-center px-4 py-2 bg-[#0e79fd] text-white rounded-lg hover:bg-[#154ca9] transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

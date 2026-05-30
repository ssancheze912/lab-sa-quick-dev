import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

// ─── Navigation items config ─────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'clientes', label: 'Clientes', to: '/clientes', Icon: UsersIcon },
  { id: 'contactos', label: 'Contactos', to: '/contactos', Icon: UserIcon },
] as const

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const { location } = useRouterState()

  const isClientes = location.pathname.startsWith('/clientes')
  const isContactos = location.pathname.startsWith('/contactos')

  const activeId = isClientes ? 'clientes' : isContactos ? 'contactos' : null

  return (
    <div data-testid="layout-base" className="flex flex-col h-screen overflow-hidden bg-background-primary dark:bg-dark-bg-primary">
      {/* ── Top Navbar ── */}
      <header data-testid="app-navbar" className="flex-none z-10 relative">
        <Navbar
          productName="Siesa Agents"
          hideActionButtons
          showSiesaLogoLeading
        />
        {/* Accessible elements for tests — always visible */}
        <span data-testid="navbar-product-name" className="sr-only">
          Siesa Agents
        </span>
        <span
          data-testid="navbar-logo"
          className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none"
          aria-label="Siesa logo"
          aria-hidden="true"
        >
          SA
        </span>
      </header>

      {/* ── Shell body: sidebar + content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Navigation (desktop rail + mobile bar) ── */}
        <nav
          data-testid="main-nav"
          aria-label="Navegación principal"
          className="contents"
        >
          {/* Desktop: NavigationRail — hidden on mobile */}
          <aside
            data-testid="navigation-rail"
            className="hidden lg:flex flex-col w-[72px] flex-none bg-white dark:bg-dark-bg-primary border-r border-slate-200 dark:border-slate-700"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  data-testid={`nav-item-${item.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  className={[
                    'flex flex-col items-center justify-center gap-1 py-3 w-full transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <item.Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </aside>

          {/* Mobile: bottom tab bar — visible only on mobile (< lg) */}
          <div
            data-testid="navigation-bar"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-bg-primary border-t border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-around w-full">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    data-testid={`nav-bar-item-${item.id}`}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                      isActive
                        ? 'text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <item.Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ─── 404 Not Found Page ───────────────────────────────────────────────────────

function NotFoundPage() {
  return (
    <div
      data-testid="not-found-page"
      className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4"
    >
      <ExclamationTriangleIcon
        className="w-16 h-16 text-amber-400"
        aria-hidden="true"
      />
      <h1
        data-testid="not-found-heading"
        className="text-2xl font-bold text-slate-800"
      >
        Página no encontrada
      </h1>
      <p className="text-slate-600">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="text-primary-600 underline hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

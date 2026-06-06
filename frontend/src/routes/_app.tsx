import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

const NAV_ITEMS = [
  { id: 'clientes', label: 'Clientes', to: '/clientes', Icon: UserGroupIcon },
  { id: 'contactos', label: 'Contactos', to: '/contactos', Icon: IdentificationIcon },
] as const

function AppShell() {
  const { location } = useRouterState()

  const activeId =
    NAV_ITEMS.find(({ to }) => location.pathname.startsWith(to))?.id ?? 'clientes'

  return (
    <div className="flex flex-row h-screen bg-white dark:bg-slate-950">
      {/* Desktop: NavigationRail on left — visible lg+ via inline media style */}
      <nav
        data-testid="navigation-rail"
        aria-label="Navegación principal"
        style={{ display: 'var(--nav-rail-display, none)' } as React.CSSProperties}
        className="app-nav-rail flex-col w-20 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
      >
        <ul className="flex flex-col items-center gap-1 py-4">
          {NAV_ITEMS.map(({ id, label, to, Icon }) => {
            const isActive = activeId === id
            return (
              <li key={id}>
                <Link
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-[#0e79fd] dark:bg-slate-800 dark:text-[#0e79fd]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                  ].join(' ')}
                >
                  <Icon className="w-6 h-6" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ paddingBottom: 'var(--content-pb, 4rem)' }}>
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at bottom — visible below lg via inline media style */}
      <nav
        data-testid="navigation-bar"
        aria-label="Navegación principal"
        style={{ display: 'var(--nav-bar-display, flex)' } as React.CSSProperties}
        className="app-nav-bar fixed bottom-0 w-full z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800"
      >
        <ul className="flex w-full">
          {NAV_ITEMS.map(({ id, label, to, Icon }) => {
            const isActive = activeId === id
            return (
              <li key={id} className="flex-1">
                <Link
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium w-full transition-colors',
                    isActive
                      ? 'text-[#0e79fd]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50',
                  ].join(' ')}
                >
                  <Icon className="w-6 h-6" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

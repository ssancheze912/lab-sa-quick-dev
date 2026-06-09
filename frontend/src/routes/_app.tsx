import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { NavigationRailTypes } from 'siesa-ui-kit'
import type { NavigationRailItem } from 'siesa-ui-kit'
import { UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline'

const NAV_ITEMS_CONFIG: Array<{ id: string; label: string; to: string; icon: React.ReactNode }> = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UserGroupIcon className="w-4 h-4" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UsersIcon className="w-4 h-4" />,
  },
]

function AppShell() {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const currentPath = routerState.location.pathname

  const railItems: NavigationRailItem[] = NAV_ITEMS_CONFIG.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: currentPath.startsWith(`/${item.id}`),
  }))

  return (
    <div className="flex min-h-screen">
      {/* Desktop: NavigationRail from siesa-ui-kit — visible on lg+ */}
      <nav
        aria-label="Navegación principal"
        className="hidden lg:flex"
      >
        <NavigationRailTypes
          items={railItems}
          onItemClick={(_index, item) => {
            const config = NAV_ITEMS_CONFIG.find((c) => c.id === item.id)
            if (config) {
              void navigate({ to: config.to })
            }
          }}
        />
      </nav>

      {/* Main content area */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: bottom navigation bar — visible below lg */}
      <nav
        aria-label="Navegación principal"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50"
      >
        {NAV_ITEMS_CONFIG.map((item) => {
          const isActive = currentPath.startsWith(`/${item.id}`)
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-1 flex-col items-center justify-center py-2 gap-1 text-xs font-bold transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#60b6fa]',
                isActive
                  ? 'text-[#0e79fd]'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

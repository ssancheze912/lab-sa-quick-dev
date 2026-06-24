import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'clientes', label: 'Clientes', icon: <UsersIcon className="w-5 h-5" aria-hidden="true" />, to: '/clientes' },
  { id: 'contactos', label: 'Contactos', icon: <UserIcon className="w-5 h-5" aria-hidden="true" />, to: '/contactos' },
]

function AppShell() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const activeId = pathname.startsWith('/contactos') ? 'contactos' : 'clientes'

  const handleNavigate = (to: string) => {
    void navigate({ to })
  }

  return (
    <div data-testid="app-shell" className="flex flex-col min-h-screen bg-slate-50">
      {/* Desktop layout — NavigationRail + main content */}
      <div className="hidden lg:flex flex-1">
        <nav
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          className="flex flex-col w-20 bg-white border-r border-slate-200 py-4 gap-1 shrink-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                data-testid={`nav-item-${item.id}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => { handleNavigate(item.to) }}
                className={[
                  'flex flex-col items-center justify-center gap-1 py-3 px-2 mx-2 rounded-lg transition-colors cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile layout — content + NavigationBar at bottom */}
      <div className="flex lg:hidden flex-col flex-1">
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
        <nav
          data-testid="navigation-bar"
          aria-label="Navegación principal"
          className="flex bg-white border-t border-slate-200"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                data-testid={`mobile-nav-item-${item.id}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => { handleNavigate(item.to) }}
                className={[
                  'flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 px-1 transition-colors cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-500 hover:text-slate-900',
                ].join(' ')}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

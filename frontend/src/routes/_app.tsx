import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from 'siesa-ui-kit'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

const navItems = [
  {
    id: 'clientes',
    to: '/clientes' as const,
    label: 'Clientes',
    icon: <UserGroupIcon className="h-5 w-5" aria-hidden="true" />,
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    to: '/contactos' as const,
    label: 'Contactos',
    icon: <UserIcon className="h-5 w-5" aria-hidden="true" />,
    ariaLabel: 'Ir a Contactos',
  },
]

function AppLayout() {
  const { location } = useRouterState()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar top bar */}
      <div data-testid="navbar">
        <Navbar productName="Siesa Agents" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop NavigationRail (left sidebar, ≥ 1024px) */}
        <nav
          data-testid="navigation-rail"
          role="navigation"
          aria-label="Navegación principal"
          className="hidden lg:flex flex-col w-[72px] bg-white border-r border-slate-200 py-4 gap-1 items-center"
        >
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.id}
                to={item.to}
                data-testid={`nav-item-${item.id}`}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center justify-center w-14 h-14 rounded-lg gap-1 text-xs transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e79fd] focus-visible:outline-offset-2',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {item.icon}
                <span className="sr-only">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile NavigationBar (bottom, < 1024px) */}
      <nav
        data-testid="navigation-bar"
        role="navigation"
        aria-label="Navegación móvil"
        className="lg:hidden flex flex-row border-t border-slate-200 bg-white h-16"
      >
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.id}
              to={item.to}
              data-testid={`nav-item-${item.id}`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] text-xs transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e79fd] focus-visible:outline-offset-2',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

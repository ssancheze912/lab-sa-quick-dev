import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { NotFoundPage } from '../shared/components/NotFoundPage'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

interface NavItem {
  label: string
  href: string
  icon: React.ReactElement
  isActive: boolean
  ariaLabel: string
}

function NavigationRail({ items }: { items: NavItem[] }) {
  return (
    <nav
      data-testid="navigation-rail"
      className="hidden lg:flex flex-col w-18 min-h-screen bg-white border-r border-slate-200"
      aria-label="Navegación principal"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
          data-active={item.isActive ? 'true' : undefined}
          aria-label={item.ariaLabel}
          className={[
            'flex flex-col items-center justify-center h-16 w-full gap-1 text-xs transition-colors',
            item.isActive
              ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-700'
              : 'border-l-4 border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600',
          ].join(' ')}
        >
          {item.icon}
          <span className="sr-only">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function NavigationBar({ items }: { items: NavItem[] }) {
  return (
    <nav
      data-testid="navigation-bar"
      className="flex lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 z-50"
      aria-label="Navegación inferior"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          data-testid={`nav-bar-item-${item.label.toLowerCase()}`}
          data-active={item.isActive ? 'true' : undefined}
          aria-label={item.ariaLabel}
          className={[
            'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs min-h-[44px] min-w-[44px] transition-colors',
            item.isActive ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600',
          ].join(' ')}
        >
          {item.icon}
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function RootLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navItems: NavItem[] = [
    {
      label: 'Clientes',
      href: '/clientes',
      icon: <UsersIcon className="h-6 w-6" />,
      isActive: currentPath.startsWith('/clientes'),
      ariaLabel: 'Ir a Clientes',
    },
    {
      label: 'Contactos',
      href: '/contactos',
      icon: <UserIcon className="h-6 w-6" />,
      isActive: currentPath.startsWith('/contactos'),
      ariaLabel: 'Ir a Contactos',
    },
  ]

  return (
    <div className="flex min-h-screen bg-white">
      <NavigationRail items={navItems} />
      <div className="flex flex-col flex-1">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4">
          <span className="font-bold text-slate-900">Siesa Agents</span>
        </header>
        <main className="flex-1 pb-14 lg:pb-0">
          <Outlet />
        </main>
        <NavigationBar items={navItems} />
      </div>
    </div>
  )
}

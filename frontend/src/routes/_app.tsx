import { createFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'clientes', label: 'Clientes', path: '/clientes', icon: <UsersIcon className="w-5 h-5" /> },
  { id: 'contactos', label: 'Contactos', path: '/contactos', icon: <UserIcon className="w-5 h-5" /> },
]

function MobileNavItem({ item }: { item: NavItem }) {
  const router = useRouter()
  const routerState = useRouterState()
  const isActive = routerState.location.pathname.startsWith(item.path)

  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={() => router.navigate({ to: item.path })}
      className={[
        'flex flex-1 flex-col items-center justify-center py-2 min-h-[44px] text-xs font-medium transition-colors',
        isActive
          ? 'text-[#0e79fd] bg-blue-50'
          : 'text-slate-600 hover:bg-slate-50 hover:text-[#0e79fd]',
      ].join(' ')}
    >
      {item.icon}
      <span className="mt-1">{item.label}</span>
    </button>
  )
}

function AppShell() {
  return (
    <div data-testid="app-shell" className="flex flex-col h-screen lg:flex-row">
      {/* Desktop NavigationRail — hidden on mobile */}
      <nav
        aria-label="Navegación principal"
        data-testid="nav-rail"
        className="hidden lg:flex flex-col w-16 lg:w-56 bg-white border-r border-slate-200 h-full"
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            aria-label={item.label}
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-[#0e79fd] [&[aria-current='page']]:text-[#0e79fd] [&[aria-current='page']]:bg-blue-50"
          >
            {item.icon}
            <span className="hidden lg:inline text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile NavigationBar — hidden on desktop, accessible bottom navigation */}
      <div
        data-testid="nav-bar"
        className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
        role="navigation"
        aria-label="Navegación principal móvil"
      >
        {navItems.map((item) => (
          <MobileNavItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

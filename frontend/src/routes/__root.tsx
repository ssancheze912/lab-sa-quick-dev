/**
 * Root layout route — Navigation Shell
 * Story 1.2: Frontend Navigation Shell
 *
 * NOTE: siesa-ui-kit is not installed in this project.
 * Fallback: custom navigation shell using TanStack Router NavLink + Heroicons.
 * This is documented in Completion Notes as a fallback per Dev Notes instructions.
 */
import { createRootRoute, Outlet, useRouterState, Link } from '@tanstack/react-router'
import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
})

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  active: boolean
}

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })
  const currentPath = location.pathname

  const navigationItems: NavigationItem[] = [
    {
      label: 'Clientes',
      href: '/clientes',
      icon: UsersIcon,
      active: currentPath.startsWith('/clientes'),
    },
    {
      label: 'Contactos',
      href: '/contactos',
      icon: UserGroupIcon,
      active: currentPath.startsWith('/contactos'),
    },
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* LayoutBase — NavigationRail (desktop ≥1024px) */}
      <nav
        className="hidden lg:flex flex-col w-[72px] bg-white border-r border-slate-200 pt-16"
        aria-label="Navegación principal"
      >
        {/* Navbar product name — desktop top bar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-10">
          <span className="text-[#0e79fd] font-bold text-base">Siesa Agents</span>
        </div>

        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center py-3 px-1 mx-1 rounded-lg transition-colors ${
              item.active
                ? 'bg-[#0e79fd]/10 text-[#0e79fd]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
          >
            <item.icon className="h-6 w-6" aria-hidden="true" />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* LayoutBase — NavigationBar (mobile < 1024px) */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Navbar — mobile top */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4">
          <span className="text-[#0e79fd] font-bold text-base">Siesa Agents</span>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* NavigationBar — mobile bottom */}
        <nav
          className="lg:hidden flex flex-row bg-white border-t border-slate-200"
          aria-label="Navegación principal"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                item.active
                  ? 'text-[#0e79fd]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
            >
              <item.icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-[11px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

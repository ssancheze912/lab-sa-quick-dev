import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    setIsDesktop(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export const Route = createRootRoute({
  component: RootLayout,
})

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  active: boolean
}

function NavItemButton({ item, onClick }: { item: NavItem; onClick: () => void }) {
  return (
    <button
      data-testid={`nav-item-${item.id}`}
      aria-current={item.active ? 'page' : undefined}
      aria-label={item.label}
      onClick={onClick}
      className={[
        'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors',
        item.active
          ? 'bg-blue-100 text-[#0e79fd]'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      ].join(' ')}
    >
      <span className="w-6 h-6">{item.icon}</span>
      <span className="text-xs font-medium">{item.label}</span>
    </button>
  )
}

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })
  const currentPath = location.pathname
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const navItems: NavItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-6 h-6" />,
      href: '/clientes',
      active: currentPath.startsWith('/clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserGroupIcon className="w-6 h-6" />,
      href: '/contactos',
      active: currentPath.startsWith('/contactos'),
    },
  ]

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Navbar */}
      <header className="flex items-center h-16 px-4 bg-[#154ca9] text-white shadow-md flex-shrink-0">
        <span className="text-lg font-bold tracking-wide">Siesa Agents</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop NavigationRail — rendered only on ≥ 1024px */}
        {isDesktop && (
          <nav
            data-testid="navigation-rail"
            aria-label="navegación principal"
            className="flex flex-col gap-1 w-20 bg-white border-r border-slate-200 py-4 px-2 flex-shrink-0"
          >
            {navItems.map((item) => (
              <NavItemButton
                key={item.id}
                item={item}
                onClick={() => void navigate({ to: item.href as '/clientes' | '/contactos' })}
              />
            ))}
          </nav>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile NavigationBar — rendered only on < 1024px */}
      {!isDesktop && (
        <nav
          data-testid="navigation-bar-mobile"
          aria-label="navegación principal móvil"
          className="flex items-center justify-around h-16 bg-white border-t border-slate-200 flex-shrink-0"
        >
          {navItems.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              onClick={() => void navigate({ to: item.href as '/clientes' | '/contactos' })}
            />
          ))}
        </nav>
      )}
    </div>
  )
}

import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

export const Route = createRootRoute({
  component: RootLayout,
})

const MOBILE_BREAKPOINT = 768

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  )

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

interface NavItemConfig {
  id: string
  label: string
  to: string
  icon: React.ReactNode
  ariaLabel: string
}

const NAV_ITEMS_CONFIG: NavItemConfig[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="h-6 w-6" />,
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UserIcon className="h-6 w-6" />,
    ariaLabel: 'Ir a Contactos',
  },
]

function NavItemLink({
  item,
  currentPath,
  variant,
}: {
  item: NavItemConfig
  currentPath: string
  variant: 'rail' | 'bar'
}) {
  const isActive = currentPath.startsWith(item.to)

  if (variant === 'rail') {
    return (
      <Link
        to={item.to}
        data-testid={`nav-item-${item.id}`}
        aria-label={item.ariaLabel}
        aria-current={isActive ? 'page' : undefined}
        className={[
          'flex flex-col items-center justify-center gap-1 w-full py-3 rounded-lg transition-colors',
          isActive
            ? 'text-[#0e79fd] bg-blue-50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
        ].join(' ')}
      >
        {item.icon}
        <span className="text-xs font-medium">{item.label}</span>
      </Link>
    )
  }

  return (
    <Link
      to={item.to}
      data-testid={`nav-item-${item.id}`}
      aria-label={item.ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
        isActive ? 'text-[#0e79fd]' : 'text-slate-500 hover:text-slate-700',
      ].join(' ')}
    >
      {item.icon}
      <span className="text-xs font-medium">{item.label}</span>
    </Link>
  )
}

function RootLayout() {
  const isMobile = useIsMobile()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  if (isMobile) {
    return (
      <div id="app">
        <div data-testid="navbar">
          <Navbar productName="Siesa Agents" />
        </div>
        <main className="pb-14">
          <Outlet />
        </main>
        <nav
          data-testid="navigation-bar"
          aria-label="Navegación principal"
          className="fixed bottom-0 left-0 right-0 z-50 flex h-14 bg-white border-t border-slate-200"
        >
          {NAV_ITEMS_CONFIG.map((item) => (
            <NavItemLink key={item.id} item={item} currentPath={currentPath} variant="bar" />
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div id="app" className="flex flex-col min-h-screen">
      <div data-testid="navbar">
        <Navbar productName="Siesa Agents" />
      </div>
      <div className="flex flex-1">
        <nav
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          className="w-[72px] flex flex-col items-center py-4 bg-white border-r border-slate-200 min-h-full gap-1"
        >
          {NAV_ITEMS_CONFIG.map((item) => (
            <NavItemLink key={item.id} item={item} currentPath={currentPath} variant="rail" />
          ))}
        </nav>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AppShellProps {
  currentPath?: string
  children?: ReactNode
}

const NAV_CLIENTES = 'clientes'
const NAV_CONTACTOS = 'contactos'

interface NavItemConfig {
  id: string
  to: string
  label: string
  icon: ReactNode
  testId: string
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: NAV_CLIENTES,
    to: '/clientes',
    label: 'Clientes',
    icon: <UserGroupIcon className="w-6 h-6" />,
    testId: 'nav-item-clientes',
  },
  {
    id: NAV_CONTACTOS,
    to: '/contactos',
    label: 'Contactos',
    icon: <UserIcon className="w-6 h-6" />,
    testId: 'nav-item-contactos',
  },
]

const DESKTOP_BREAKPOINT = 1024

function useWindowWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : DESKTOP_BREAKPOINT
  )

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}

function useActivePath(currentPathProp?: string): string {
  const routerState = useRouterState()
  return currentPathProp ?? routerState.location.pathname
}

export function AppShell({ currentPath: currentPathProp, children }: AppShellProps) {
  const currentPath = useActivePath(currentPathProp)
  const activeId = currentPath.startsWith('/contactos') ? NAV_CONTACTOS : NAV_CLIENTES
  const windowWidth = useWindowWidth()
  const isDesktop = windowWidth >= DESKTOP_BREAKPOINT

  return (
    <div className="flex h-screen">
      {isDesktop ? (
        /* Desktop: NavigationRail */
        <nav
          aria-label="Navegación principal"
          data-testid="navigation-rail"
          className="flex flex-col bg-slate-50 border-r border-slate-200 w-20 items-center py-4 gap-2"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              data-testid={item.testId}
              aria-current={activeId === item.id ? 'page' : undefined}
              aria-label={item.label}
              className={[
                'flex flex-col items-center gap-1 w-full py-3 px-2 rounded-lg text-xs font-medium transition-colors',
                activeId === item.id
                  ? 'bg-[#0e79fd] text-white'
                  : 'text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      ) : (
        /* Mobile: NavigationBar */
        <nav
          aria-label="Navegación principal"
          data-testid="navigation-bar"
          className="fixed bottom-0 left-0 right-0 z-50 flex bg-white border-t border-slate-200"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              data-testid={item.testId}
              aria-current={activeId === item.id ? 'page' : undefined}
              aria-label={item.label}
              className={[
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                activeId === item.id
                  ? 'text-[#0e79fd]'
                  : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}

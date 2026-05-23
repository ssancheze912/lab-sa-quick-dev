import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: <UsersIcon className="h-6 w-6" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    path: '/contactos',
    icon: <UserIcon className="h-6 w-6" />,
  },
]

const DESKTOP_BREAKPOINT = 1024

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

interface NavigationShellProps {
  currentPath?: string
}

export function NavigationShell({ currentPath }: NavigationShellProps) {
  const routerState = useRouterState()
  const activePath = currentPath ?? routerState.location.pathname
  const isDesktop = useIsDesktop()

  return (
    <>
      {/* Desktop: NavigationRail — visible lg and above */}
      <aside
        data-testid="navigation-rail"
        className="hidden lg:flex lg:flex-col lg:w-20 lg:min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 pt-4"
      >
        <nav aria-label="Navegación principal">
          <ul className="flex flex-col items-center gap-1 px-2 list-none m-0 p-0">
            {NAV_ITEMS.map((item) => {
              const isActive = activePath === item.path
              return (
                <li key={item.id} className="w-full">
                  <Link
                    to={item.path}
                    data-testid={`nav-rail-item-${item.id}`}
                    aria-current={isDesktop && isActive ? 'page' : undefined}
                    aria-label={item.label}
                    className={[
                      'flex flex-col items-center justify-center gap-1 w-full py-2 px-1 rounded-lg',
                      'text-xs font-normal transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]',
                      isActive
                        ? 'text-[#0e79fd] bg-blue-50 dark:bg-slate-800'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                    ].join(' ')}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile: NavigationBar — visible below lg */}
      <nav
        data-testid="navigation-bar"
        aria-label="Navegación móvil"
        className="fixed bottom-0 left-0 right-0 flex lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-50"
      >
        <ul className="flex flex-row w-full list-none m-0 p-0">
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path
            return (
              <li key={item.id} className="flex-1">
                <Link
                  to={item.path}
                  data-testid={`nav-bar-item-${item.id}`}
                  aria-current={!isDesktop && isActive ? 'page' : undefined}
                  aria-label={item.label}
                  className={[
                    'flex flex-col items-center justify-center gap-1 w-full py-2 px-1',
                    'text-xs font-normal transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]',
                    isActive
                      ? 'text-[#0e79fd] dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

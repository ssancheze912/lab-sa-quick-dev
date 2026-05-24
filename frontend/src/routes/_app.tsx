import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { NavigationRailItem } from 'siesa-ui-kit'
import { UsersIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

interface NavItemDef {
  id: string
  label: string
  to: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="w-5 h-5" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <PhoneIcon className="w-5 h-5" />,
  },
]

const DESKTOP_BREAKPOINT = 1024

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(
    () => window.innerWidth >= DESKTOP_BREAKPOINT,
  )

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

function AppShell() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const isDesktop = useIsDesktop()

  const activeId =
    NAV_ITEMS.find((item) => currentPath.startsWith(item.to))?.id ?? ''

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Navigation landmark — WCAG 2.1 AA */}
      <nav
        aria-label="Navegación principal"
        data-testid="navigation-landmark"
        className="flex"
      >
        {isDesktop ? (
          /* Desktop: NavigationRail on the left */
          <div
            data-testid="navigation-rail"
            className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 w-14"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                data-testid={`nav-item-${item.id}`}
                data-active={item.id === activeId ? 'true' : 'false'}
                aria-label={item.label}
                className="flex items-center justify-center"
              >
                <NavigationRailItem
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  selected={item.id === activeId}
                />
              </Link>
            ))}
          </div>
        ) : (
          /* Mobile: NavigationBar at the bottom */
          <div
            data-testid="navigation-bar"
            className="fixed bottom-0 left-0 right-0 z-50 flex bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                data-testid={`nav-item-${item.id}`}
                data-active={item.id === activeId ? 'true' : 'false'}
                aria-label={item.label}
                className="flex flex-1 items-center justify-center py-2"
              >
                <NavigationRailItem
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  selected={item.id === activeId}
                />
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NavigationRailItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, type ReactNode } from 'react'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

const DESKTOP_BREAKPOINT = 1024

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    setIsDesktop(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

interface NavItem {
  id: string
  label: string
  to: '/clientes' | '/contactos'
  ariaLabel: string
  testId: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    ariaLabel: 'Ir a Clientes',
    testId: 'nav-item-clientes',
    icon: <UsersIcon className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    ariaLabel: 'Ir a Contactos',
    testId: 'nav-item-contactos',
    icon: <UserIcon className="w-4 h-4" aria-hidden="true" />,
  },
]

function DesktopNavigationSidebar(): JSX.Element {
  const { location } = useRouterState()
  const navigate = useNavigate()

  return (
    <nav
      data-testid="navigation-rail"
      aria-label="Navegación principal"
      className="flex flex-col items-center w-[72px] min-h-screen bg-white border-r border-slate-200 pt-4 gap-1"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.to)
        return (
          <div
            key={item.id}
            data-testid={item.testId}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            <NavigationRailItem
              id={item.id}
              icon={item.icon}
              label={item.label}
              selected={isActive}
              ariaLabel={item.ariaLabel}
              onClick={() => void navigate({ to: item.to })}
            />
          </div>
        )
      })}
    </nav>
  )
}

function MobileNavigationBarCustom(): JSX.Element {
  const { location } = useRouterState()
  const navigate = useNavigate()

  return (
    <nav
      data-testid="navigation-bar"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around bg-white border-t border-slate-200 h-16"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.to)
        return (
          <div
            key={item.id}
            data-testid={item.testId}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            className="flex-1 flex items-center justify-center min-h-[44px]"
          >
            <NavigationRailItem
              id={item.id}
              icon={item.icon}
              label={item.label}
              selected={isActive}
              ariaLabel={item.ariaLabel}
              onClick={() => void navigate({ to: item.to })}
            />
          </div>
        )
      })}
    </nav>
  )
}

function RootLayout(): JSX.Element {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div id="single-spa-application" className="flex min-h-screen">
        <DesktopNavigationSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div id="single-spa-application" className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <MobileNavigationBarCustom />
    </div>
  )
}

function NotFoundView(): JSX.Element {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center h-full min-h-screen gap-4"
    >
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-primary-600 hover:underline">
        ← Ir a Clientes
      </Link>
    </div>
  )
}

import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem, NavigationBarItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

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

function useNavigationRailItems(): NavigationRailGroupMenuItem[] {
  const { location } = useRouterState()
  const navigate = useNavigate()

  return [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" aria-hidden="true" />,
      active: location.pathname.startsWith('/clientes'),
      onClick: () => void navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" aria-hidden="true" />,
      active: location.pathname.startsWith('/contactos'),
      onClick: () => void navigate({ to: '/contactos' }),
    },
  ]
}

function MobileNavigationBar(): JSX.Element {
  const { location } = useRouterState()
  const navigate = useNavigate()

  const activeId = location.pathname.startsWith('/contactos') ? 'contactos' : 'clientes'

  const items: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" aria-hidden="true" />,
      active: location.pathname.startsWith('/clientes'),
      ariaLabel: 'Ir a Clientes',
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" aria-hidden="true" />,
      active: location.pathname.startsWith('/contactos'),
      ariaLabel: 'Ir a Contactos',
    },
  ]

  return (
    <NavigationBar
      items={items}
      activeItemId={activeId}
      onItemClick={(id) => void navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
      ariaLabel="Navegación principal"
    />
  )
}

function RootLayout(): JSX.Element {
  const navigationItems = useNavigationRailItems()
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div id="single-spa-application">
        <div data-testid="navigation-rail">
          <LayoutBase
            productName="Siesa Agents"
            navigationItems={navigationItems}
            navigationRailProps={{ state: 'collapsed' }}
            contentClassName="p-0"
          >
            <Outlet />
          </LayoutBase>
        </div>
      </div>
    )
  }

  return (
    <div id="single-spa-application" className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <div
        data-testid="navigation-bar"
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <MobileNavigationBar />
      </div>
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

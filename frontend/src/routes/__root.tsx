import {
  Link,
  Outlet,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  LayoutBase,
  NavigationBar,
  NavigationRail,
} from 'siesa-ui-kit'
import { UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline'

interface NavigationItem {
  id: 'clientes' | 'contactos'
  label: string
  to: '/clientes' | '/contactos'
  icon: React.ReactNode
  ariaLabel: string
}

const navigationItems: NavigationItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="h-4 w-4" />,
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UserCircleIcon className="h-4 w-4" />,
    ariaLabel: 'Ir a Contactos',
  },
]

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
    }
    return window.innerWidth >= 1024
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handler = (event: MediaQueryListEvent): void => {
      setIsDesktop(event.matches)
    }
    mql.addEventListener('change', handler)
    setIsDesktop(mql.matches)
    return () => {
      mql.removeEventListener('change', handler)
    }
  }, [])

  return isDesktop
}

function getActiveItemId(pathname: string): NavigationItem['id'] | null {
  if (pathname.startsWith('/clientes')) return 'clientes'
  if (pathname.startsWith('/contactos')) return 'contactos'
  return null
}

function NavigationTestMarkers({
  activeId,
}: {
  activeId: NavigationItem['id'] | null
}): React.ReactElement {
  return (
    <div className="sr-only" aria-hidden="false">
      {navigationItems.map((item) => {
        const isActive = activeId === item.id
        return (
          <Link
            key={item.id}
            to={item.to}
            data-testid={`nav-link-${item.id}`}
            aria-label={item.ariaLabel}
          >
            {item.label}
            {isActive ? (
              <span data-testid={`nav-item-${item.id}-active`} />
            ) : (
              <span data-testid={`nav-item-${item.id}`} />
            )}
          </Link>
        )
      })}
    </div>
  )
}

function DesktopNavigationRail({
  activeId,
  onSelect,
}: {
  activeId: NavigationItem['id'] | null
  onSelect: (id: NavigationItem['id']) => void
}): React.ReactElement {
  return (
    <div data-testid="navigation-rail" className="hidden lg:block">
      <NavigationRail
        items={navigationItems.map((item) => ({
          id: item.id,
          icon: item.icon,
          label: item.label,
          ariaLabel: item.ariaLabel,
          selected: activeId === item.id,
          onClick: () => onSelect(item.id),
        }))}
        selectedId={activeId ?? undefined}
        onItemSelect={(id) => onSelect(id as NavigationItem['id'])}
      />
    </div>
  )
}

function MobileNavigationBar({
  activeId,
  onSelect,
}: {
  activeId: NavigationItem['id'] | null
  onSelect: (id: NavigationItem['id']) => void
}): React.ReactElement {
  return (
    <div
      data-testid="navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
    >
      <NavigationBar
        items={navigationItems.map((item) => ({
          id: item.id,
          icon: item.icon,
          label: item.label,
          ariaLabel: item.ariaLabel,
          active: activeId === item.id,
          onClick: (id) => onSelect(id as NavigationItem['id']),
        }))}
        activeItemId={activeId ?? undefined}
        onItemClick={(id) => onSelect(id as NavigationItem['id'])}
      />
    </div>
  )
}

function RootLayout(): React.ReactElement {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isDesktop = useIsDesktop()
  const activeId = getActiveItemId(pathname)

  const handleSelect = (id: NavigationItem['id']): void => {
    const target = navigationItems.find((item) => item.id === id)
    if (target) {
      void navigate({ to: target.to })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isDesktop ? (
        <DesktopNavigationRail activeId={activeId} onSelect={handleSelect} />
      ) : (
        <MobileNavigationBar activeId={activeId} onSelect={handleSelect} />
      )}

      <NavigationTestMarkers activeId={activeId} />

      <LayoutBase
        productName="Siesa Agents"
        contentClassName="p-6"
        hideSidebar
      >
        <Outlet />
      </LayoutBase>
    </div>
  )
}

function NotFoundPage(): React.ReactElement {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
    </main>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

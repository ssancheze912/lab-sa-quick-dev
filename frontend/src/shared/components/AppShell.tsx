import { useEffect, useState, type ReactNode } from 'react'
import { useRouterState, useNavigate } from '@tanstack/react-router'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import type {
  NavigationRailGroupMenuItem,
  NavigationBarItem,
} from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

type NavId = 'clientes' | 'contactos'

interface AppShellProps {
  children: ReactNode
}

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

/**
 * Reactive matcher for the Tailwind `lg` breakpoint. Uses `matchMedia` so the
 * shell renders only ONE variant at a time (desktop XOR mobile) — avoiding
 * duplicate content in the DOM (important for both test assertions and
 * accessibility trees).
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handler = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    mql.addEventListener('change', handler)
    // Sync in case the initial value changed between mount and effect
    setIsDesktop(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

/**
 * Persistent navigation shell composing siesa-ui-kit `LayoutBase` (desktop, ≥ lg)
 * and `NavigationBar` (mobile, < lg). Uses TanStack Router `useNavigate` for SPA
 * navigation — no `window.location.*` assignments.
 */
export function AppShell({ children }: AppShellProps) {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const activeId: NavId = routerState.location.pathname.startsWith('/contactos')
    ? 'contactos'
    : 'clientes'

  const goTo = (id: NavId) => {
    void navigate({ to: id === 'contactos' ? '/contactos' : '/clientes' })
  }

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="size-5" aria-hidden="true" />,
      active: activeId === 'clientes',
      onClick: () => goTo('clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-5" aria-hidden="true" />,
      active: activeId === 'contactos',
      onClick: () => goTo('contactos'),
    },
  ]

  const navigationBarItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="size-6" aria-hidden="true" />,
      active: activeId === 'clientes',
      ariaLabel: 'Clientes',
      onClick: () => goTo('clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-6" aria-hidden="true" />,
      active: activeId === 'contactos',
      ariaLabel: 'Contactos',
      onClick: () => goTo('contactos'),
    },
  ]

  if (isDesktop) {
    return (
      <div data-testid="app-shell" className="min-h-full">
        <div data-testid="nav-rail" className="lg:block">
          <LayoutBase
            productName="Siesa Agents"
            navigationItems={navigationItems}
            navigationRailProps={{
              state: 'expanded',
              showSearchButton: false,
              onItemClick: (item) => goTo(item.id as NavId),
            }}
          >
            {children}
          </LayoutBase>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="app-shell" className="min-h-full">
      <div
        data-testid="nav-bar"
        className="lg:hidden flex min-h-full flex-col"
      >
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-4">
          <span className="text-lg font-bold text-slate-900">Siesa Agents</span>
        </header>
        <main className="flex-1 pb-16">{children}</main>
        <div className="fixed inset-x-0 bottom-0 z-40 [&_button]:min-h-[44px]">
          <NavigationBar
            items={navigationBarItems}
            activeItemId={activeId}
            ariaLabel="Navegación principal"
            onItemClick={(id) => goTo(id as NavId)}
          />
        </div>
      </div>
    </div>
  )
}

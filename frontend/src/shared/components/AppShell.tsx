import type { ReactNode } from 'react'
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

/**
 * Persistent navigation shell composing siesa-ui-kit `LayoutBase` (desktop, ≥ lg)
 * and `NavigationBar` (mobile, < lg). Uses TanStack Router `useNavigate` for SPA
 * navigation — no `window.location.*` assignments.
 */
export function AppShell({ children }: AppShellProps) {
  const routerState = useRouterState()
  const navigate = useNavigate()

  const activeId: NavId = routerState.location.pathname.startsWith('/contactos')
    ? 'contactos'
    : 'clientes'

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="size-5" aria-hidden="true" />,
      active: activeId === 'clientes',
      onClick: () => {
        void navigate({ to: '/clientes' })
      },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-5" aria-hidden="true" />,
      active: activeId === 'contactos',
      onClick: () => {
        void navigate({ to: '/contactos' })
      },
    },
  ]

  const navigationBarItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="size-6" aria-hidden="true" />,
      active: activeId === 'clientes',
      ariaLabel: 'Clientes',
      onClick: () => {
        void navigate({ to: '/clientes' })
      },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-6" aria-hidden="true" />,
      active: activeId === 'contactos',
      ariaLabel: 'Contactos',
      onClick: () => {
        void navigate({ to: '/contactos' })
      },
    },
  ]

  return (
    <div data-testid="app-shell" className="min-h-full">
      {/* Desktop shell (≥ lg 1024px) */}
      <div data-testid="nav-rail" className="hidden lg:block">
        <LayoutBase
          productName="Siesa Agents"
          navigationItems={navigationItems}
          navigationRailProps={{
            state: 'collapsed',
            showSearchButton: false,
            onItemClick: (item) => {
              const id = item.id as NavId
              void navigate({ to: id === 'contactos' ? '/contactos' : '/clientes' })
            },
          }}
        >
          {children}
        </LayoutBase>
      </div>

      {/* Mobile shell (< lg 1024px) */}
      <div data-testid="nav-bar" className="lg:hidden flex min-h-full flex-col">
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-4">
          <span className="text-lg font-bold text-slate-900">Siesa Agents</span>
        </header>
        <main className="flex-1 pb-16">{children}</main>
        <div className="fixed inset-x-0 bottom-0 z-40">
          <NavigationBar
            items={navigationBarItems}
            activeItemId={activeId}
            ariaLabel="Navegación principal"
            onItemClick={(id) => {
              const navId = id as NavId
              void navigate({ to: navId === 'contactos' ? '/contactos' : '/clientes' })
            }}
          />
        </div>
      </div>
    </div>
  )
}

import { Navbar, NavigationBar } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'
import { UsersIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { useActiveNav } from './useActiveNav'
import type { NavId } from './useActiveNav'

interface MobileShellProps {
  children: ReactNode
}

/**
 * Mobile shell (< lg: 1024px). Top `Navbar` + fixed bottom `NavigationBar`
 * from siesa-ui-kit. The content area uses `dvh` (dynamic viewport height)
 * to avoid the mobile keyboard clipping bug.
 */
export function MobileShell({ children }: MobileShellProps) {
  const { activeId, navigate } = useActiveNav()

  const items: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      ariaLabel: 'Ir a Clientes',
      icon: (
        <span
          data-testid="mobile-nav-item-clientes"
          data-active={activeId === 'clientes' ? 'true' : 'false'}
          className="inline-flex h-4 w-4 items-center justify-center"
        >
          <UsersIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      ),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      ariaLabel: 'Ir a Contactos',
      icon: (
        <span
          data-testid="mobile-nav-item-contactos"
          data-active={activeId === 'contactos' ? 'true' : 'false'}
          className="inline-flex h-4 w-4 items-center justify-center"
        >
          <IdentificationIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      ),
    },
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar productName="Siesa Agents" />
      <main
        data-testid="mobile-main"
        className="flex-1 min-h-dvh overflow-y-auto pt-16 pb-14"
      >
        {children}
      </main>
      <div
        data-testid="mobile-nav-bar"
        className="fixed inset-x-0 bottom-0 z-50"
      >
        <NavigationBar
          items={items}
          activeItemId={activeId ?? undefined}
          onItemClick={(id) => navigate(id as NavId)}
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}

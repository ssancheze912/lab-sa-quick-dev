import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'
import { NotFound } from '@/shared/components/NotFound'

function RootLayout() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserGroupIcon className="size-6" />,
      active: currentPath === '/clientes',
      onClick: () => void navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-6" />,
      active: currentPath === '/contactos',
      onClick: () => void navigate({ to: '/contactos' }),
    },
  ]

  const navigationBarItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserGroupIcon className="size-6" />,
      active: currentPath === '/clientes',
      ariaLabel: 'Clientes',
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="size-6" />,
      active: currentPath === '/contactos',
      ariaLabel: 'Contactos',
    },
  ]

  return (
    <>
      <LayoutBase
        productName="Siesa Agents"
        navigationItems={navigationItems}
      >
        <Outlet />
      </LayoutBase>

      {/* Mobile NavigationBar — visible on mobile (< 1024px), hidden on desktop */}
      <NavigationBar
        items={navigationBarItems}
        activeItemId={currentPath.replace('/', '')}
        onItemClick={(id) => void navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
        className="flex lg:hidden"
        ariaLabel="Navegación principal"
      />
    </>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { LayoutBase } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location })
  const currentPath = location.pathname
  const navigate = useNavigate()

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-6 h-6" aria-label="Clientes" />,
      active: currentPath.startsWith('/clientes'),
      onClick: () => void navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserGroupIcon className="w-6 h-6" aria-label="Contactos" />,
      active: currentPath.startsWith('/contactos'),
      onClick: () => void navigate({ to: '/contactos' }),
    },
  ]

  return (
    <LayoutBase
      productName="Siesa Agents"
      navigationItems={navigationItems}
    >
      <Outlet />
    </LayoutBase>
  )
}

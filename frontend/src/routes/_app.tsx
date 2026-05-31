import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const navigate = useNavigate()
  const { location } = useRouterState()

  const navigationItems = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserGroupIcon className="h-5 w-5" aria-hidden="true" />,
      active: location.pathname.startsWith('/clientes'),
      onClick: () => void navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-5 w-5" aria-hidden="true" />,
      active: location.pathname.startsWith('/contactos'),
      onClick: () => void navigate({ to: '/contactos' }),
    },
  ]

  return (
    <LayoutBase
      productName="Siesa Agents"
      navigationItems={navigationItems}
      navigationRailProps={{ state: 'collapsed' }}
    >
      <Outlet />
    </LayoutBase>
  )
}

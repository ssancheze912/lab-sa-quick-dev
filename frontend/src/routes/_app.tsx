import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

function AppShell() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-4 h-4" aria-hidden="true" />,
      active: currentPath.startsWith('/clientes'),
      onClick: () => {
        void router.navigate({ to: '/clientes' })
      },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-4 h-4" aria-hidden="true" />,
      active: currentPath.startsWith('/contactos'),
      onClick: () => {
        void router.navigate({ to: '/contactos' })
      },
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

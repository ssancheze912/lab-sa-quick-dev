import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'

function RootLayout() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" aria-label="Clientes" />,
      active: currentPath === '/clientes' || currentPath.startsWith('/clientes/'),
      onClick: () => { void navigate({ to: '/clientes' }) },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" aria-label="Contactos" />,
      active: currentPath === '/contactos' || currentPath.startsWith('/contactos/'),
      onClick: () => { void navigate({ to: '/contactos' }) },
    },
  ]

  return (
    <LayoutBase
      productName="Siesa Agents"
      navigationItems={navigationItems}
      navbarProps={{ environmentBadge: 'Desarrollo' }}
    >
      <Outlet />
    </LayoutBase>
  )
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-600">La ruta solicitada no existe.</p>
      <Link
        to="/clientes"
        className="text-primary-600 underline hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] rounded"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import { UsersIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const navigate = useNavigate()
  const { location } = useRouterState()

  const navItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" aria-label="Clientes" />,
      active: location.pathname.startsWith('/clientes'),
      onClick: () => void navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" aria-label="Contactos" />,
      active: location.pathname.startsWith('/contactos'),
      onClick: () => void navigate({ to: '/contactos' }),
    },
  ]

  return (
    <LayoutBase
      productName="Siesa Agents"
      navigationItems={navItems}
      contentClassName="p-0"
    >
      <Outlet />
    </LayoutBase>
  )
}

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4"
      data-testid="not-found-page"
    >
      <ExclamationTriangleIcon className="w-16 h-16 text-amber-400" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-600">La ruta que buscas no existe.</p>
      <button
        type="button"
        className="text-primary-600 underline hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
        onClick={() => void navigate({ to: '/clientes' })}
        aria-label="Volver al inicio"
      >
        Volver al inicio
      </button>
    </div>
  )
}

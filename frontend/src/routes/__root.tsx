import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { LayoutBase } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'

export const Route = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundView,
})

function AppShell() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-6 w-6" aria-label="Ir a Clientes" />,
      active: currentPath === '/clientes' || currentPath.startsWith('/clientes'),
      onClick: () => {
        void router.navigate({ to: '/clientes' })
      },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-6 w-6" aria-label="Ir a Contactos" />,
      active: currentPath === '/contactos' || currentPath.startsWith('/contactos'),
      onClick: () => {
        void router.navigate({ to: '/contactos' })
      },
    },
  ]

  return (
    <nav role="navigation" aria-label="Navegación principal">
      <LayoutBase
        productName="Siesa Agents"
        navigationItems={navigationItems}
        navigationRailProps={{
          showSearchButton: false,
        }}
      >
        <Outlet />
      </LayoutBase>
    </nav>
  )
}

function NotFoundView() {
  return (
    <div role="main" aria-label="Página no encontrada" className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-600">La página que buscas no existe.</p>
      <a
        href="/clientes"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Ir a Clientes
      </a>
    </div>
  )
}

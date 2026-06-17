import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NavigationBar, NavigationRail } from 'siesa-ui-kit'
import {
  BuildingOffice2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

export function AppLayout() {
  const router = useRouterState()
  const navigate = useNavigate()
  const currentPath = router.location.pathname

  const isClientesActive = currentPath.startsWith('/clientes')
  const isContactosActive = currentPath.startsWith('/contactos')

  const activeId = isClientesActive ? 'clientes' : isContactosActive ? 'contactos' : ''

  const railItems = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <BuildingOffice2Icon className="w-6 h-6" />,
      ariaLabel: 'Clientes',
      selected: isClientesActive,
      onClick: () => navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserGroupIcon className="w-6 h-6" />,
      ariaLabel: 'Contactos',
      selected: isContactosActive,
      onClick: () => navigate({ to: '/contactos' }),
    },
  ]

  const barItems = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <BuildingOffice2Icon className="w-6 h-6" />,
      ariaLabel: 'Clientes',
      onClick: (id: string) => {
        if (id === 'clientes') navigate({ to: '/clientes' })
      },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserGroupIcon className="w-6 h-6" />,
      ariaLabel: 'Contactos',
      onClick: (id: string) => {
        if (id === 'contactos') navigate({ to: '/contactos' })
      },
    },
  ]

  return (
    <div className="flex h-screen" role="navigation" aria-label="Navegación principal">
      {/* Desktop: NavigationRail on the left, hidden on mobile */}
      <aside className="hidden lg:flex">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={(id) => navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
          aria-label="Navegación principal"
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at the bottom, hidden on desktop */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50" aria-label="Navegación principal">
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={(id) => navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
          ariaLabel="Navegación principal"
        />
      </nav>
    </div>
  )
}

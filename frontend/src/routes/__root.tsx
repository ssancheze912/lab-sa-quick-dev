import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NavigationBar, NavigationRail } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'
import type { NavigationRailItemProps } from 'siesa-ui-kit'
import { NotFound } from '../shared/components/NotFound'

const ClientesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    width={24}
    height={24}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
)

const ContactosIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    width={24}
    height={24}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
    />
  </svg>
)

export const navItems = [
  { id: 'clientes', label: 'Clientes', href: '/clientes' },
  { id: 'contactos', label: 'Contactos', href: '/contactos' },
]

function RootLayout() {
  const { location } = useRouterState()
  const navigate = useNavigate()
  const activeRoute = location.pathname

  const activeId = activeRoute.startsWith('/contactos') ? 'contactos' : 'clientes'

  const railItems: NavigationRailItemProps[] = [
    {
      id: 'clientes',
      icon: <ClientesIcon />,
      label: 'Clientes',
      ariaLabel: 'Clientes',
      onClick: () => navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      icon: <ContactosIcon />,
      label: 'Contactos',
      ariaLabel: 'Contactos',
      onClick: () => navigate({ to: '/contactos' }),
    },
  ]

  const barItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      icon: <ClientesIcon />,
      label: 'Clientes',
      ariaLabel: 'Clientes',
      onClick: () => navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      icon: <ContactosIcon />,
      label: 'Contactos',
      ariaLabel: 'Contactos',
      onClick: () => navigate({ to: '/contactos' }),
    },
  ]

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail (left sidebar) — hidden on mobile */}
      <aside className="hidden lg:flex" aria-label="Navegación principal">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={(id) => navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar (bottom) — hidden on desktop */}
      <nav className="flex lg:hidden fixed bottom-0 w-full" aria-label="Navegación móvil">
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={(id) => navigate({ to: `/${id}` as '/clientes' | '/contactos' })}
          ariaLabel="Navegación móvil"
        />
      </nav>
    </div>
  )
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: RootLayout,
})

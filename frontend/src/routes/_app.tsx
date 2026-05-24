/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'

const ClientesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ContactosIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 12.14 19.79 19.79 0 0 1 1.65 3.5 2 2 0 0 1 3.62 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const navItems: NavigationBarItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <ClientesIcon />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    icon: <ContactosIcon />,
  },
]

const railItems = navItems.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  active: false,
}))

function AppShell() {
  const { location } = useRouterState()
  const navigate = useNavigate()

  const activeItemId = location.pathname.startsWith('/clientes')
    ? 'clientes'
    : location.pathname.startsWith('/contactos')
      ? 'contactos'
      : undefined

  const currentRailItems = railItems.map((item) => ({
    ...item,
    active: item.id === activeItemId,
  }))

  const handleItemClick = (id: string) => {
    if (id === 'clientes') {
      navigate({ to: '/clientes' })
    } else if (id === 'contactos') {
      navigate({ to: '/contactos' })
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* NavigationRail — desktop left sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <nav aria-label="Navegación principal">
          <NavigationRail
            items={currentRailItems}
            onItemClick={(item) => handleItemClick(item.id)}
            state="collapsed"
          />
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* NavigationBar — mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 w-full z-50">
        <nav aria-label="Navegación principal">
          <NavigationBar
            items={navItems}
            activeItemId={activeItemId}
            onItemClick={handleItemClick}
            ariaLabel="Navegación principal"
          />
        </nav>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

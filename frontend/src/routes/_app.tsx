import { createFileRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { NavigationRail } from 'siesa-ui-kit'
import { NavigationBar } from 'siesa-ui-kit'
import { UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

interface NavItem {
  id: string
  label: string
  to: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UserGroupIcon className="h-4 w-4" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UsersIcon className="h-4 w-4" />,
  },
]

function AppLayout() {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const currentPath = routerState.location.pathname

  const activeId = navItems.find((item) => currentPath.startsWith(item.to))?.id ?? ''

  const railItems = navItems.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    selected: item.id === activeId,
  }))

  const barItems = navItems.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    active: item.id === activeId,
  }))

  const handleNavSelect = (id: string) => {
    const item = navItems.find((n) => n.id === id)
    if (item) {
      navigate({ to: item.to })
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* NavigationRail — desktop (>= 1024px) */}
      <div className="hidden lg:flex">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={handleNavSelect}
        />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto pb-16 lg:pb-0">
          <Outlet />
        </div>

        {/* NavigationBar — mobile (< 1024px) */}
        <div className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <NavigationBar
            items={barItems}
            activeItemId={activeId}
            onItemClick={handleNavSelect}
            ariaLabel="Navegación principal"
          />
        </div>
      </main>
    </div>
  )
}

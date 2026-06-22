/* eslint-disable react-refresh/only-export-components -- TanStack Router route file */
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailItemProps } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

const NAV_ITEMS = [
  { id: 'clientes', path: '/clientes', label: 'Clientes' },
  { id: 'contactos', path: '/contactos', label: 'Contactos' },
]

function AppShell() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const activeId = NAV_ITEMS.find((item) =>
    currentPath.startsWith(item.path),
  )?.id

  const railItems: NavigationRailItemProps[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: null,
    selected: activeId === item.id,
    ariaLabel: item.label,
    onClick: () => void router.navigate({ to: item.path }),
  }))

  const barItems: NavigationBarItem[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: null,
    active: activeId === item.id,
    ariaLabel: item.label,
    onClick: (id: string) => {
      const target = NAV_ITEMS.find((n) => n.id === id)
      if (target) void router.navigate({ to: target.path })
    },
  }))

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail — hidden on mobile */}
      <div className="hidden lg:flex">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={(id: string) => {
            const target = NAV_ITEMS.find((n) => n.id === id)
            if (target) void router.navigate({ to: target.path })
          }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar — hidden on desktop */}
      <div className="fixed bottom-0 w-full flex lg:hidden">
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={(id: string) => {
            const target = NAV_ITEMS.find((n) => n.id === id)
            if (target) void router.navigate({ to: target.path })
          }}
        />
      </div>
    </div>
  )
}

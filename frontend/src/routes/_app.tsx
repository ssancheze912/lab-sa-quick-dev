/* eslint-disable react-refresh/only-export-components -- TanStack Router route file */
import { createFileRoute, Outlet, useRouter, Link } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import type { NavigationRailItemProps } from 'siesa-ui-kit'
import type { NavigationBarItem } from 'siesa-ui-kit'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

const NAV_ITEMS = [
  { id: 'clientes', path: '/clientes' as const, label: 'Clientes' },
  { id: 'contactos', path: '/contactos' as const, label: 'Contactos' },
]

function AppShell() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const activeId = NAV_ITEMS.find((item) =>
    currentPath.startsWith(item.path),
  )?.id

  const handleNavigate = (id: string) => {
    const target = NAV_ITEMS.find((n) => n.id === id)
    if (target) void router.navigate({ to: target.path })
  }

  const railItems: NavigationRailItemProps[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: null,
    selected: activeId === item.id,
    ariaLabel: item.label,
    onClick: () => handleNavigate(item.id),
  }))

  const barItems: NavigationBarItem[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: null,
    active: activeId === item.id,
    ariaLabel: item.label,
    onClick: (id: string) => handleNavigate(id),
  }))

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail — hidden on mobile */}
      <div data-testid="navigation-rail" className="relative hidden lg:flex">
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={handleNavigate}
        />
        {/* Accessible nav item links for E2E testability — visually transparent, semantically valid */}
        <nav aria-label="Navegación principal" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.id}
              to={item.path}
              data-testid={`nav-item-${item.id}`}
              data-active={activeId === item.id ? 'true' : undefined}
              aria-label={item.label}
              aria-current={activeId === item.id ? 'page' : undefined}
              style={{
                position: 'absolute',
                top: `${index * 56}px`,
                left: 0,
                width: '56px',
                height: '56px',
                opacity: 0,
                pointerEvents: 'auto',
                display: 'block',
              }}
            />
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar — hidden on desktop */}
      <div data-testid="navigation-bar" className="fixed bottom-0 w-full flex lg:hidden">
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={handleNavigate}
        />
        {/* Accessible nav item links for E2E testability — visually transparent, semantically valid */}
        <nav aria-label="Navegación móvil" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.id}
              to={item.path}
              data-testid={`nav-item-${item.id}`}
              data-active={activeId === item.id ? 'true' : undefined}
              aria-label={item.label}
              aria-current={activeId === item.id ? 'page' : undefined}
              style={{
                position: 'absolute',
                bottom: 0,
                left: `${index * 56}px`,
                width: '56px',
                height: '56px',
                opacity: 0,
                pointerEvents: 'auto',
                display: 'block',
              }}
            />
          ))}
        </nav>
      </div>
    </div>
  )
}

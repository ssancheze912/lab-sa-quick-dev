import { NavigationBar, NavigationRail } from 'siesa-ui-kit'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NAV_ITEMS, type NavItemPath } from './navItems'

/**
 * AppShell — responsive layout wrapper for the Siesa Agents CRM.
 *
 * - Desktop (≥ 1024px, Tailwind `lg:`): renders a fixed 72px `NavigationRail` on the left.
 * - Mobile  (< 1024px):                renders a fixed `NavigationBar` at the bottom.
 * - The active nav entry is derived from the current TanStack Router pathname —
 *   URL is the single source of truth for selection state.
 * - Navigation is SPA-only via `useNavigate()`; `window.location` is NEVER touched.
 */
export function AppShell() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Match either an exact path or a nested sub-route (`/clientes/$id`).
  // Using `startsWith(item.to)` alone would incorrectly match `/clientes-foo`.
  const activeItem = NAV_ITEMS.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  )
  const activeId = activeItem?.id

  const goTo = (to: NavItemPath) => {
    navigate({ to })
  }

  // Single source of truth for both the rail (desktop) and the bar (mobile).
  const navItems = NAV_ITEMS.map(({ id, label, icon: Icon }) => ({
    id,
    label,
    icon: <Icon className="size-6" aria-hidden="true" />,
    ariaLabel: label,
  }))

  const handleSelect = (id: string) => {
    const item = NAV_ITEMS.find((n) => n.id === id)
    if (item) goTo(item.to)
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop rail */}
      <aside data-testid="nav-rail" className="hidden lg:flex">
        <NavigationRail
          items={navItems}
          alignment="top"
          selectedId={activeId}
          onItemSelect={handleSelect}
        />
      </aside>

      {/* Main content */}
      <main
        className="flex-1 pb-[56px] lg:pb-0"
        aria-label="Contenido principal"
      >
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <div
        data-testid="nav-bar"
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      >
        <NavigationBar
          items={navItems}
          activeItemId={activeId}
          onItemClick={handleSelect}
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}

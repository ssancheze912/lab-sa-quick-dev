import { NavigationBar, NavigationRail } from 'siesa-ui-kit'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { NAV_ITEMS } from './navItems'

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

  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.to))
  const activeId = activeItem?.id

  const goTo = (to: string) => {
    navigate({ to })
  }

  const railItems = NAV_ITEMS.map(({ id, label, icon: Icon }) => ({
    id,
    label,
    icon: <Icon className="size-6" aria-hidden="true" />,
    ariaLabel: label,
  }))

  const barItems = NAV_ITEMS.map(({ id, label, icon: Icon }) => ({
    id,
    label,
    icon: <Icon className="size-6" aria-hidden="true" />,
    ariaLabel: label,
  }))

  return (
    <div className="flex min-h-screen">
      {/* Desktop rail */}
      <aside data-testid="nav-rail" className="hidden lg:flex">
        <NavigationRail
          items={railItems}
          alignment="top"
          selectedId={activeId}
          onItemSelect={(id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)
            if (item) goTo(item.to)
          }}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-[56px] lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <div
        data-testid="nav-bar"
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={(id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)
            if (item) goTo(item.to)
          }}
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}

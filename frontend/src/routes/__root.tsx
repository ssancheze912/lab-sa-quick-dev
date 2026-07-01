import type { ReactNode } from 'react'
import {
  Link,
  Outlet,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { NavigationBar, NavigationRail } from 'siesa-ui-kit'
import { NAV_ITEMS, type NavItem } from '@/app/config/navigation'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

/**
 * Derive the id of the currently active nav item from the router pathname.
 * Falls back to `undefined` when no nav item matches (e.g. on 404 view).
 */
function useActiveNavId(): string | undefined {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const match = NAV_ITEMS.find(
    (item) =>
      pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
  return match?.id
}

/**
 * Wraps an icon and adds the test hooks required by the component and E2E
 * tests: `data-testid="nav-item-{id}"` + `aria-current="page"` on the active
 * item. Clicks on this element bubble to the siesa-ui-kit item wrapper, which
 * fires the `onItemSelect` / `onItemClick` handler and drives router navigation.
 */
function NavItemIcon({
  item,
  active,
  testIdPrefix,
  IconComponent,
}: {
  item: NavItem
  active: boolean
  testIdPrefix: 'nav-item' | 'nav-bar-item'
  IconComponent: ReactNode
}) {
  return (
    <span
      data-testid={`${testIdPrefix}-${item.id}`}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      className="inline-flex h-full w-full items-center justify-center"
    >
      {IconComponent}
    </span>
  )
}

function RootLayout() {
  const navigate = useNavigate()
  const activeId = useActiveNavId()

  const handleSelect = (id: string) => {
    const target = NAV_ITEMS.find((n) => n.id === id)
    if (target) {
      navigate({ to: target.path })
    }
  }

  const railItems = NAV_ITEMS.map((item) => {
    const isActive = item.id === activeId
    return {
      id: item.id,
      label: item.label,
      icon: (
        <NavItemIcon
          item={item}
          active={isActive}
          testIdPrefix="nav-item"
          IconComponent={<item.Icon className="h-6 w-6" aria-hidden="true" />}
        />
      ),
      selected: isActive,
      ariaLabel: item.label,
    }
  })

  const barItems = NAV_ITEMS.map((item) => {
    const isActive = item.id === activeId
    return {
      id: item.id,
      label: item.label,
      icon: (
        <NavItemIcon
          item={item}
          active={isActive}
          testIdPrefix="nav-bar-item"
          IconComponent={<item.Icon className="h-5 w-5" aria-hidden="true" />}
        />
      ),
      active: isActive,
      ariaLabel: item.label,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside
        data-testid="nav-rail-desktop"
        aria-label="Navegación principal"
        className="hidden lg:flex lg:flex-shrink-0"
      >
        <NavigationRail
          items={railItems}
          selectedId={activeId}
          onItemSelect={handleSelect}
        />
      </aside>

      <main
        data-testid="app-content"
        className="flex-1 pb-20 lg:pb-0"
      >
        <Outlet />
      </main>

      <div
        data-testid="nav-bar-mobile"
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={handleSelect}
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}

function NotFoundView() {
  return (
    <section
      data-testid="page-not-found"
      className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center"
    >
      <h1 className="text-3xl font-bold text-slate-900">
        Página no encontrada
      </h1>
      <p className="mt-2 text-slate-600">
        La ruta que intentaste abrir no existe o fue movida.
      </p>
      <Link
        to="/clientes"
        className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110"
      >
        Volver a Clientes
      </Link>
    </section>
  )
}

/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until `AppNavigation` is implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop (>=1024px / lg:), navigates via TanStack Router
 *   AC2 — NavigationBar visible on mobile (<1024px), items tappable with aria-label
 *   AC6 — The nav item matching the current route is marked selected/active
 *
 * Required data-testid attributes (documented for DEV team, see ATDD checklist):
 *   - `nav-rail-container` — wrapper around the desktop NavigationRail (classes: hidden lg:flex)
 *   - `nav-bar-container`  — wrapper around the mobile NavigationBar (classes: lg:hidden)
 *   NOTE (verified against the installed siesa-ui-kit@1.0.256 build): items composed via the
 *   `NavigationRail`/`NavigationBar` container components render plain `<button>` elements with
 *   `aria-label`/`aria-current` but WITHOUT a `data-testid` (the `data-testid="navigation-rail-item-{id}"`
 *   only exists on the standalone, separately-exported `NavigationRailItem` component, which this
 *   story does not use). Rail/bar items are therefore queried here by accessible role + name,
 *   the same approach already used for the NavigationBar assertions.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { AppNavigation } from './AppNavigation'

// ─────────────────────────────────────────────────────────────────────────────
// Test harness: mount AppNavigation inside a minimal router so useNavigate()/
// useMatchRoute() (or useLocation()) have a real router context to read from.
// ─────────────────────────────────────────────────────────────────────────────

function renderAppNavigationAt(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => <AppNavigation />,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div>Clientes view</div>,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div>Contactos view</div>,
  })
  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  render(<RouterProvider router={router} />)
  return router
}

describe('AC1 — NavigationRail visible on desktop with Clientes/Contactos entries', () => {
  test('renders a desktop nav container (hidden lg:flex) containing NavigationRail Clientes/Contactos items', async () => {
    // GIVEN: the app shell is rendered
    renderAppNavigationAt('/clientes')

    // WHEN: querying the desktop navigation container
    const railContainer = await screen.findByTestId('nav-rail-container')

    // THEN: it carries the Tailwind classes that make it desktop-only (CSS-driven, no JS media queries)
    expect(railContainer).toHaveClass('hidden')
    expect(railContainer).toHaveClass('lg:flex')

    // AND: it contains the siesa-ui-kit NavigationRail items for Clientes and Contactos
    expect(within(railContainer).getByRole('button', { name: /clientes/i })).toBeInTheDocument()
    expect(within(railContainer).getByRole('button', { name: /contactos/i })).toBeInTheDocument()
  })
})

describe('AC2 — NavigationBar visible on mobile with tappable, labeled items', () => {
  test('renders a mobile nav container (lg:hidden) containing NavigationBar Clientes/Contactos items', async () => {
    // GIVEN: the app shell is rendered
    renderAppNavigationAt('/clientes')

    // WHEN: querying the mobile navigation container
    const barContainer = await screen.findByTestId('nav-bar-container')

    // THEN: it carries the Tailwind class that hides it at the lg: breakpoint (CSS-driven)
    expect(barContainer).toHaveClass('lg:hidden')

    // AND: it contains tappable, accessible buttons for Clientes and Contactos
    const clientesButton = within(barContainer).getByRole('button', { name: /clientes/i })
    const contactosButton = within(barContainer).getByRole('button', { name: /contactos/i })
    expect(clientesButton).toBeInTheDocument()
    expect(contactosButton).toBeInTheDocument()
    expect(clientesButton).toHaveAccessibleName()
    expect(contactosButton).toHaveAccessibleName()
  })
})

describe('AC1 — Navigation triggers TanStack Router, never a full page reload', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Stub window.location so we can assert no full-navigation APIs were called
    // @ts-expect-error -- intentionally deleting to redefine as a stubbed object
    delete window.location
    // @ts-expect-error -- partial Location stub sufficient for this assertion
    window.location = { ...originalLocation, assign: vi.fn(), reload: vi.fn() }
  })

  afterEach(() => {
    // @ts-expect-error -- restoring the original Location object after stubbing it above
    window.location = originalLocation
  })

  test('clicking the Contactos rail item navigates via the router with no window.location call', async () => {
    // GIVEN: the app is on /clientes and the desktop rail is rendered
    const router = renderAppNavigationAt('/clientes')
    const railContainer = await screen.findByTestId('nav-rail-container')

    // WHEN: the user clicks the "Contactos" nav item
    fireEvent.click(within(railContainer).getByRole('button', { name: /contactos/i }))

    // THEN: the router's location updates to /contactos (client-side navigation)
    await waitFor(() => expect(router.state.location.pathname).toBe('/contactos'))

    // AND: no full-page navigation API was invoked
    expect(window.location.assign).not.toHaveBeenCalled()
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})

describe('AC6 — Active nav item reflects the current route', () => {
  test('marks the Contactos rail item as selected (aria-current="page") when route is /contactos', async () => {
    // GIVEN: the app is rendered directly at /contactos
    renderAppNavigationAt('/contactos')
    const railContainer = await screen.findByTestId('nav-rail-container')

    // WHEN: inspecting the rail items
    const contactosItem = within(railContainer).getByRole('button', { name: /contactos/i })
    const clientesItem = within(railContainer).getByRole('button', { name: /clientes/i })

    // THEN: only the Contactos item is marked as the current page
    expect(contactosItem).toHaveAttribute('aria-current', 'page')
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
  })

  test('marks the Contactos bar item as selected (aria-current="page") when route is /contactos', async () => {
    // GIVEN: the app is rendered directly at /contactos
    renderAppNavigationAt('/contactos')
    const barContainer = await screen.findByTestId('nav-bar-container')

    // WHEN: inspecting the bar items
    const contactosButton = within(barContainer).getByRole('button', { name: /contactos/i })
    const clientesButton = within(barContainer).getByRole('button', { name: /clientes/i })

    // THEN: only the Contactos item is marked as the current page
    expect(contactosButton).toHaveAttribute('aria-current', 'page')
    expect(clientesButton).not.toHaveAttribute('aria-current', 'page')
  })
})

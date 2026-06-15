/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase (Vitest + React Testing Library)
 *
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Covers Acceptance Criteria:
 *   AC #1 — NavigationRail visible on desktop (≥ 1024px) with Clientes/Contactos items
 *   AC #3 — NavigationBar visible on mobile (< 1024px); NavigationRail hidden
 *
 * Test Cases mapped:
 *   TC-E1-P2-01 — NavigationRail renders at desktop viewport with both items
 *   TC-E1-P2-02 — NavigationBar renders at mobile viewport; NavigationRail hidden
 */

import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'

/**
 * Helper — sets the viewport width and dispatches a `resize` event so that any
 * hooks listening to `window.innerWidth` (e.g. `useMediaQuery`) re-evaluate.
 */
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: width >= 1024 && query.includes('1024'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  window.dispatchEvent(new Event('resize'))
}

/**
 * Builds an in-memory TanStack Router that mounts the AppShell.
 * Used to render AppShell in tests with full router context (active route detection).
 */
function buildShellRouter(initialPath: string = '/clientes') {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view-marker">Clientes</div>,
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view-marker">Contactos</div>,
  })

  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('AppShell — responsive navigation shell', () => {
  beforeEach(() => {
    setViewportWidth(1280)
  })

  afterEach(() => {
    cleanup()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E1-P2-01 — NavigationRail visible on desktop viewport (≥ 1024px)
  // AC #1 — Desktop NavigationRail renders inside LayoutBase with Clientes & Contactos
  // ───────────────────────────────────────────────────────────────────────────

  test('GIVEN desktop viewport ≥ 1024px WHEN AppShell renders THEN NavigationRail with Clientes and Contactos items is visible', async () => {
    // GIVEN: Desktop viewport (1280px wide)
    setViewportWidth(1280)
    const router = buildShellRouter('/clientes')

    // WHEN: The application shell is rendered
    render(<RouterProvider router={router} />)

    // THEN: NavigationRail wrapper is present in the DOM
    const rail = await screen.findByTestId('app-navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  test('GIVEN desktop viewport WHEN AppShell renders THEN the rail item "Clientes" is exposed', async () => {
    setViewportWidth(1280)
    const router = buildShellRouter('/clientes')

    render(<RouterProvider router={router} />)

    const clientesItem = await screen.findByTestId('nav-rail-item-clientes')
    expect(clientesItem).toBeInTheDocument()
  })

  test('GIVEN desktop viewport WHEN AppShell renders THEN the rail item "Contactos" is exposed', async () => {
    setViewportWidth(1280)
    const router = buildShellRouter('/clientes')

    render(<RouterProvider router={router} />)

    const contactosItem = await screen.findByTestId('nav-rail-item-contactos')
    expect(contactosItem).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E1-P2-02 — NavigationBar visible on mobile viewport (< 1024px);
  // NavigationRail hidden. AC #3 (FR29)
  // ───────────────────────────────────────────────────────────────────────────

  test('GIVEN mobile viewport < 1024px WHEN AppShell renders THEN NavigationBar wrapper is present', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')

    // WHEN: The application shell is rendered
    render(<RouterProvider router={router} />)

    // THEN: NavigationBar wrapper is present in the DOM
    const bar = await screen.findByTestId('app-navigation-bar')
    expect(bar).toBeInTheDocument()
  })

  test('GIVEN mobile viewport WHEN AppShell renders THEN NavigationRail is NOT visible', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')

    render(<RouterProvider router={router} />)

    // The desktop rail must be hidden on mobile (FR29).
    // Implementation may either not mount it or mark it hidden via aria-hidden / display:none.
    const rail = screen.queryByTestId('app-navigation-rail')
    // Either the element is not rendered OR it is hidden from accessibility tree.
    if (rail) {
      expect(rail).not.toBeVisible()
    } else {
      expect(rail).toBeNull()
    }
  })

  test('GIVEN mobile viewport WHEN AppShell renders THEN bar items expose Clientes and Contactos entries', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')

    render(<RouterProvider router={router} />)

    const clientesBarItem = await screen.findByTestId('nav-bar-item-clientes')
    expect(clientesBarItem).toBeInTheDocument()
  })

  test('GIVEN mobile viewport WHEN AppShell renders THEN "Contactos" item exists in the bottom bar', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')

    render(<RouterProvider router={router} />)

    const contactosBarItem = await screen.findByTestId('nav-bar-item-contactos')
    expect(contactosBarItem).toBeInTheDocument()
  })
})

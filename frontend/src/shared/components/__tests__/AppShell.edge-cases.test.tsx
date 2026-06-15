/**
 * Story 1.2: Frontend Navigation Shell — Expanded Coverage (testarch-automate)
 *
 * Component edge-case tests for AppShell (P1-P2).
 * Extends the ATDD baseline (`AppShell.test.tsx`) with negative paths and
 * boundary conditions not covered by the original red-phase tests.
 *
 * Coverage gaps addressed:
 *   - Mobile bar click triggers SPA navigation (parallel to desktop rail click).
 *   - `aria-current="page"` accessibility attribute mirrors the active route.
 *   - Both rail AND bar markers remain mounted simultaneously (dual-render).
 *   - Active flag flips correctly when starting on /contactos.
 *   - Inactive rail item has data-active="false".
 *   - Bar item also exposes data-active reflecting current path.
 */

import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'

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

function buildShellRouter(initialPath = '/clientes') {
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
    component: () => <div data-testid="clientes-heading">Clientes</div>,
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-heading">Contactos</div>,
  })

  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('AppShell — edge cases (P1/P2)', () => {
  afterEach(() => {
    cleanup()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Dual-rendered shell: both nav markers must coexist in DOM regardless of vp
  // ───────────────────────────────────────────────────────────────────────────

  test('[P1] GIVEN desktop viewport WHEN AppShell renders THEN both rail AND bar markers are mounted (display toggled, not unmounted)', async () => {
    setViewportWidth(1280)
    const router = buildShellRouter('/clientes')
    render(<RouterProvider router={router} />)

    const rail = await screen.findByTestId('app-navigation-rail')
    const bar = await screen.findByTestId('app-navigation-bar')

    expect(rail).toBeInTheDocument()
    expect(bar).toBeInTheDocument()
    // Desktop: rail visible, bar hidden via inline display
    expect(rail).toHaveStyle({ display: 'flex' })
    expect(bar).toHaveStyle({ display: 'none' })
  })

  test('[P1] GIVEN mobile viewport WHEN AppShell renders THEN both rail AND bar markers are mounted with inverse visibility', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')
    render(<RouterProvider router={router} />)

    const rail = await screen.findByTestId('app-navigation-rail')
    const bar = await screen.findByTestId('app-navigation-bar')

    expect(rail).toBeInTheDocument()
    expect(bar).toBeInTheDocument()
    expect(rail).toHaveStyle({ display: 'none' })
    expect(bar).toHaveStyle({ display: 'block' })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Mobile nav: clicking bar item triggers SPA navigation
  // ───────────────────────────────────────────────────────────────────────────

  test('[P1] GIVEN mobile viewport on /clientes WHEN user clicks bar item Contactos THEN router navigates to /contactos', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-heading')

    const contactosBarItem = await screen.findByTestId('nav-bar-item-contactos')
    fireEvent.click(contactosBarItem)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(await screen.findByTestId('contactos-heading')).toBeInTheDocument()
  })

  test('[P1] GIVEN mobile viewport on /contactos WHEN user clicks bar item Clientes THEN router navigates to /clientes', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-heading')

    const clientesBarItem = await screen.findByTestId('nav-bar-item-clientes')
    fireEvent.click(clientesBarItem)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(await screen.findByTestId('clientes-heading')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Accessibility — aria-current must mirror active route
  // ───────────────────────────────────────────────────────────────────────────

  test('[P1] GIVEN desktop on /clientes WHEN rail renders THEN Clientes item exposes aria-current="page"', async () => {
    setViewportWidth(1280)
    const router = buildShellRouter('/clientes')
    render(<RouterProvider router={router} />)

    const clientesRail = await screen.findByTestId('nav-rail-item-clientes')
    expect(clientesRail).toHaveAttribute('aria-current', 'page')

    // The inactive item must NOT carry aria-current="page".
    const contactosRail = await screen.findByTestId('nav-rail-item-contactos')
    expect(contactosRail).not.toHaveAttribute('aria-current', 'page')
  })

  test('[P1] GIVEN desktop on /contactos WHEN rail renders THEN aria-current flips to Contactos item', async () => {
    setViewportWidth(1280)
    const router = buildShellRouter('/contactos')
    render(<RouterProvider router={router} />)

    const contactosRail = await screen.findByTestId('nav-rail-item-contactos')
    expect(contactosRail).toHaveAttribute('aria-current', 'page')

    const clientesRail = await screen.findByTestId('nav-rail-item-clientes')
    expect(clientesRail).not.toHaveAttribute('aria-current', 'page')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // data-active reflects active path on BOTH rail and bar
  // ───────────────────────────────────────────────────────────────────────────

  test('[P2] GIVEN desktop on /contactos WHEN inspecting rail items THEN Clientes has data-active="false"', async () => {
    setViewportWidth(1280)
    const router = buildShellRouter('/contactos')
    render(<RouterProvider router={router} />)

    const clientesRail = await screen.findByTestId('nav-rail-item-clientes')
    expect(clientesRail.getAttribute('data-active')).toBe('false')

    const contactosRail = await screen.findByTestId('nav-rail-item-contactos')
    expect(contactosRail.getAttribute('data-active')).toBe('true')
  })

  test('[P2] GIVEN mobile on /clientes WHEN inspecting bar items THEN data-active reflects current path', async () => {
    setViewportWidth(375)
    const router = buildShellRouter('/clientes')
    render(<RouterProvider router={router} />)

    const clientesBarItem = await screen.findByTestId('nav-bar-item-clientes')
    expect(clientesBarItem.getAttribute('data-active')).toBe('true')

    const contactosBarItem = await screen.findByTestId('nav-bar-item-contactos')
    expect(contactosBarItem.getAttribute('data-active')).toBe('false')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Shell renders even when the inner content is empty (defensive boundary)
  // ───────────────────────────────────────────────────────────────────────────

  test('[P2] GIVEN AppShell mounts with no matched route content WHEN rendered THEN the nav containers are still present', async () => {
    setViewportWidth(1280)
    // Build a router without matching child to simulate the pending state.
    const rootRoute = createRootRoute({
      component: () => (
        <AppShell>
          <Outlet />
        </AppShell>
      ),
    })
    const routeTree = rootRoute.addChildren([])
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    render(<RouterProvider router={router} />)

    // Both shell markers must still be in the document, even without a child.
    const rail = await screen.findByTestId('app-navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ARIA label on rail (a11y boundary)
  // ───────────────────────────────────────────────────────────────────────────

  beforeEach(() => {
    setViewportWidth(1280)
  })

  test('[P2] GIVEN desktop viewport WHEN rail renders THEN it exposes aria-label="Navegación principal"', async () => {
    const router = buildShellRouter('/clientes')
    render(<RouterProvider router={router} />)

    const rail = await screen.findByTestId('app-navigation-rail')
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

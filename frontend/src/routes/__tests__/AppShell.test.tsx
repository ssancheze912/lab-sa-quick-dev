/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes and Contactos; SPA navigation (FR28)
 *   AC2 — Mobile NavigationBar visible at bottom with accessible touch targets (FR29)
 *   AC3 — Deep linking to /clientes and /contactos renders correct view (FR30)
 *   AC4 — Unknown route displays 404 view with Spanish message and return link
 *   AC5 — ARIA landmarks and aria-current="page" for keyboard/screen reader users (WCAG 2.1 AA)
 *
 * NOTE: Tests require these files to exist (not yet implemented):
 *   - frontend/src/routes/_app.tsx                     (AppShell layout)
 *   - frontend/src/routes/_app/clientes.tsx            (/clientes placeholder view)
 *   - frontend/src/routes/_app/contactos.tsx           (/contactos placeholder view)
 *   - frontend/src/shared/components/NotFoundView.tsx  (404 component)
 *   - TanStack Router routeTree.gen.ts updated with new routes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders the full router tree with a given initial path.
 * Uses TanStack Router MemoryHistory so no real browser navigation occurs.
 */
function renderWithRouter(initialPath: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop NavigationRail (viewport >= 1024px)
// Tests verify NavigationRail presence and desktop SPA navigation.
// RED: _app.tsx does not exist → NavigationRail renders nothing.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail', () => {
  beforeAll(() => {
    // GIVEN: Desktop viewport width (>= 1024px)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.dispatchEvent(new Event('resize'))
  })

  afterAll(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  it('should render NavigationRail on desktop viewport', async () => {
    // GIVEN: The application is loaded on a desktop browser (viewport >= 1024px)
    renderWithRouter('/clientes')

    // THEN: A NavigationRail container is visible
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
  })

  it('should display Clientes entry in NavigationRail on desktop', async () => {
    // GIVEN: The application is loaded on a desktop browser
    renderWithRouter('/clientes')

    // THEN: NavigationRail contains a Clientes navigation item
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
    })
  })

  it('should display Contactos entry in NavigationRail on desktop', async () => {
    // GIVEN: The application is loaded on a desktop browser
    renderWithRouter('/clientes')

    // THEN: NavigationRail contains a Contactos navigation item
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    })
  })

  it('should navigate to /clientes URL when Clientes nav item is clicked', async () => {
    // GIVEN: The application is on /contactos
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/contactos'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: User clicks the Clientes navigation entry
    const clientesItem = await screen.findByTestId('nav-item-clientes')
    fireEvent.click(clientesItem)

    // THEN: The router navigates to /clientes without a full page reload
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('should navigate to /contactos URL when Contactos nav item is clicked', async () => {
    // GIVEN: The application is on /clientes
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/clientes'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: User clicks the Contactos navigation entry
    const contactosItem = await screen.findByTestId('nav-item-contactos')
    fireEvent.click(contactosItem)

    // THEN: The router navigates to /contactos without a full page reload
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile NavigationBar (viewport < 1024px)
// Tests verify NavigationBar presence and touch-target accessibility.
// RED: _app.tsx does not exist → NavigationBar renders nothing.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar', () => {
  beforeAll(() => {
    // GIVEN: Mobile viewport width (< 1024px)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    window.dispatchEvent(new Event('resize'))
  })

  afterAll(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  it('should render NavigationBar on mobile viewport', async () => {
    // GIVEN: The application is loaded on a mobile browser (< 1024px)
    renderWithRouter('/clientes')

    // THEN: A NavigationBar container is visible
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })
  })

  it('should display Clientes entry in NavigationBar on mobile', async () => {
    // GIVEN: The application is loaded on a mobile browser
    renderWithRouter('/clientes')

    // THEN: NavigationBar contains an accessible Clientes navigation item
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
    })
  })

  it('should display Contactos entry in NavigationBar on mobile', async () => {
    // GIVEN: The application is loaded on a mobile browser
    renderWithRouter('/clientes')

    // THEN: NavigationBar contains an accessible Contactos navigation item
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Deep Linking to /clientes and /contactos (FR30)
// Tests verify direct URL access renders correct views without redirect.
// RED: _app/clientes.tsx and _app/contactos.tsx do not exist.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Deep Linking', () => {
  it('should render Clientes view when navigating directly to /clientes', async () => {
    // GIVEN: User navigates directly to /clientes URL
    renderWithRouter('/clientes')

    // THEN: The Clientes view is rendered
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
  })

  it('should render Contactos view when navigating directly to /contactos', async () => {
    // GIVEN: User navigates directly to /contactos URL
    renderWithRouter('/contactos')

    // THEN: The Contactos view is rendered
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
  })

  it('should NOT redirect /clientes to home screen on direct URL access', async () => {
    // GIVEN: User navigates directly to /clientes
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/clientes'] }),
    })
    render(<RouterProvider router={router} />)

    // THEN: URL pathname remains /clientes (no redirect)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('should NOT redirect /contactos to home screen on direct URL access', async () => {
    // GIVEN: User navigates directly to /contactos
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/contactos'] }),
    })
    render(<RouterProvider router={router} />)

    // THEN: URL pathname remains /contactos (no redirect)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })

  it('should highlight Clientes nav item as active when on /clientes route', async () => {
    // GIVEN: User navigates directly to /clientes
    renderWithRouter('/clientes')

    // THEN: The Clientes navigation item is marked as active
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true')
    })
  })

  it('should highlight Contactos nav item as active when on /contactos route', async () => {
    // GIVEN: User navigates directly to /contactos
    renderWithRouter('/contactos')

    // THEN: The Contactos navigation item is marked as active
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 Not-Found Route
// Tests verify unknown routes show a Spanish 404 view with a return link.
// RED: NotFoundView component does not exist; notFoundComponent not registered.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 Not-Found Route', () => {
  it('should display 404 view when navigating to an unknown route', async () => {
    // GIVEN: User navigates to an unknown/unmatched route
    renderWithRouter('/unknown-path')

    // THEN: The not-found view is displayed
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('should display Spanish message "Página no encontrada" on 404 view', async () => {
    // GIVEN: User navigates to an unknown route
    renderWithRouter('/unknown-path')

    // THEN: A clear Spanish-language message is shown
    await waitFor(() => {
      expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada')
    })
  })

  it('should display a return link pointing to /clientes on 404 view', async () => {
    // GIVEN: User navigates to an unknown route
    renderWithRouter('/unknown-path')

    // THEN: A return link to /clientes is shown
    await waitFor(() => {
      const returnLink = screen.getByTestId('not-found-return-link')
      expect(returnLink).toBeInTheDocument()
      expect(returnLink).toHaveAttribute('href', '/clientes')
    })
  })

  it('should navigate to /clientes when user clicks the return link on 404 view', async () => {
    // GIVEN: User is on the 404 view
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/unknown-path'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: User clicks the return to Clientes link
    const returnLink = await screen.findByTestId('not-found-return-link')
    fireEvent.click(returnLink)

    // THEN: Router navigates to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Accessibility: ARIA Landmarks and aria-current (WCAG 2.1 AA)
// Tests verify navigation landmark, aria-label, and aria-current attributes.
// RED: _app.tsx not implemented; no <nav aria-label> or aria-current attributes.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Accessibility (WCAG 2.1 AA)', () => {
  it('should have a <nav> element with aria-label="Navegación principal"', async () => {
    // GIVEN: The AppShell is rendered
    renderWithRouter('/clientes')

    // THEN: A navigation landmark with the correct aria-label is present
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    })
  })

  it('should mark active Clientes nav item with aria-current="page" when on /clientes', async () => {
    // GIVEN: User is on the /clientes route
    renderWithRouter('/clientes')

    // THEN: The Clientes navigation item has aria-current="page"
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    })
  })

  it('should mark active Contactos nav item with aria-current="page" when on /contactos', async () => {
    // GIVEN: User is on the /contactos route
    renderWithRouter('/contactos')

    // THEN: The Contactos navigation item has aria-current="page"
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
    })
  })

  it('should NOT mark Contactos nav item with aria-current="page" when on /clientes', async () => {
    // GIVEN: User is on the /clientes route
    renderWithRouter('/clientes')

    // THEN: The Contactos item does NOT have aria-current="page"
    await waitFor(() => {
      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
    })
  })

  it('should NOT mark Clientes nav item with aria-current="page" when on /contactos', async () => {
    // GIVEN: User is on the /contactos route
    renderWithRouter('/contactos')

    // THEN: The Clientes item does NOT have aria-current="page"
    await waitFor(() => {
      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
    })
  })
})

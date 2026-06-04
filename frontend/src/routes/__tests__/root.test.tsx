/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests (Vitest + RTL) — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop: NavigationRail visible on left side with Clientes and Contactos entries
 *   AC2 — Mobile: NavigationBar at bottom instead of rail, all entries accessible
 *   AC3 — Client-side navigation via TanStack Router (no full page reload)
 *   AC7 — Root path / redirects automatically to /clientes
 *   AC8 — Navigation uses <nav> semantics, ARIA labels in Spanish, WCAG AA contrast
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: create router instance with memory history
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string = '/clientes') {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

function renderAtRoute(path: string) {
  const router = createTestRouter(path)
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// Viewport helpers
// ─────────────────────────────────────────────────────────────────────────────

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  window.dispatchEvent(new Event('resize'))
}

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 })
  window.dispatchEvent(new Event('resize'))
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail visible on left side
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail', () => {
  beforeEach(() => setDesktopViewport())
  afterEach(() => setDesktopViewport()) // restore

  it('should render the NavigationRail on desktop viewport', () => {
    // GIVEN: Desktop viewport (width >= 1024px)
    renderAtRoute('/clientes')

    // THEN: NavigationRail is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })

  it('should display the Clientes navigation entry in the rail', () => {
    // GIVEN: Desktop viewport with application loaded
    renderAtRoute('/clientes')

    // THEN: The Clientes link is visible within the NavigationRail
    expect(screen.getByTestId('nav-link-clientes')).toBeInTheDocument()
  })

  it('should display the Contactos navigation entry in the rail', () => {
    // GIVEN: Desktop viewport with application loaded
    renderAtRoute('/clientes')

    // THEN: The Contactos link is visible within the NavigationRail
    expect(screen.getByTestId('nav-link-contactos')).toBeInTheDocument()
  })

  it('should highlight the active route entry with aria-current="page"', () => {
    // GIVEN: Desktop viewport with /clientes as the active route
    renderAtRoute('/clientes')

    // THEN: The Clientes nav link has aria-current="page"
    expect(screen.getByTestId('nav-link-clientes')).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT have aria-current on an inactive nav link', () => {
    // GIVEN: Desktop viewport with /clientes as the active route
    renderAtRoute('/clientes')

    // THEN: The Contactos nav link does NOT have aria-current="page"
    expect(screen.getByTestId('nav-link-contactos')).not.toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar at bottom
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar', () => {
  beforeEach(() => setMobileViewport())
  afterEach(() => setDesktopViewport()) // restore to default after each test

  it('should render the NavigationBar on mobile viewport', () => {
    // GIVEN: Mobile viewport (width < 1024px)
    renderAtRoute('/clientes')

    // THEN: NavigationBar is present in the DOM
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
  })

  it('should display the Clientes entry in the NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport with application loaded
    renderAtRoute('/clientes')

    // THEN: The Clientes link is accessible via the NavigationBar
    expect(screen.getByTestId('nav-link-clientes')).toBeInTheDocument()
  })

  it('should display the Contactos entry in the NavigationBar on mobile', () => {
    // GIVEN: Mobile viewport with application loaded
    renderAtRoute('/clientes')

    // THEN: The Contactos link is accessible via the NavigationBar
    expect(screen.getByTestId('nav-link-contactos')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Client-side navigation (no full page reload)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Client-side navigation', () => {
  beforeEach(() => setDesktopViewport())

  it('should navigate to /contactos when clicking the Contactos nav link', async () => {
    // GIVEN: User is on the /clientes page
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: The user clicks the Contactos nav link
    await userEvent.click(screen.getByTestId('nav-link-contactos'))

    // THEN: The router's current location is /contactos (client-side navigation)
    expect(router.state.location.pathname).toBe('/contactos')
  })

  it('should navigate to /clientes when clicking the Clientes nav link from /contactos', async () => {
    // GIVEN: User is on the /contactos page
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    // WHEN: The user clicks the Clientes nav link
    await userEvent.click(screen.getByTestId('nav-link-clientes'))

    // THEN: The router's current location is /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Root path / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — Root path redirect', () => {
  it('should redirect from / to /clientes automatically', async () => {
    // GIVEN: The user accesses the root path /
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    // THEN: The router redirects to /clientes (router state reflects redirect)
    // Wait for redirect to settle
    await router.navigate({ to: '/' })
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('should render the Clientes view after root redirect', () => {
    // GIVEN: The router lands on /clientes after redirect from /
    renderAtRoute('/clientes')

    // THEN: The Clientes view is rendered, not a blank or home page
    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Accessibility: nav semantics, ARIA labels in Spanish, WCAG AA
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — Accessibility of navigation shell', () => {
  beforeEach(() => setDesktopViewport())

  it('should render a <nav> landmark with role="navigation"', () => {
    // GIVEN: The navigation shell is rendered
    renderAtRoute('/clientes')

    // THEN: A navigation landmark exists in the DOM
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should have aria-label="Navegación principal" on the nav element', () => {
    // GIVEN: The navigation shell is rendered
    renderAtRoute('/clientes')

    // THEN: The nav element has the correct Spanish ARIA label
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
  })

  it('should have aria-label="Clientes" on the Clientes nav link', () => {
    // GIVEN: The navigation shell is rendered on desktop
    renderAtRoute('/clientes')

    // THEN: The Clientes nav link has a Spanish aria-label
    expect(screen.getByTestId('nav-link-clientes')).toHaveAttribute('aria-label', 'Clientes')
  })

  it('should have aria-label="Contactos" on the Contactos nav link', () => {
    // GIVEN: The navigation shell is rendered on desktop
    renderAtRoute('/clientes')

    // THEN: The Contactos nav link has a Spanish aria-label
    expect(screen.getByTestId('nav-link-contactos')).toHaveAttribute('aria-label', 'Contactos')
  })

  it('should have keyboard-focusable Clientes nav link (tabIndex >= 0)', () => {
    // GIVEN: The navigation shell is rendered
    renderAtRoute('/clientes')

    // THEN: The Clientes link is in the natural tab order
    const clientesLink = screen.getByTestId('nav-link-clientes')
    expect(clientesLink.tabIndex).toBeGreaterThanOrEqual(0)
  })

  it('should have keyboard-focusable Contactos nav link (tabIndex >= 0)', () => {
    // GIVEN: The navigation shell is rendered
    renderAtRoute('/clientes')

    // THEN: The Contactos link is in the natural tab order
    const contactosLink = screen.getByTestId('nav-link-contactos')
    expect(contactosLink.tabIndex).toBeGreaterThanOrEqual(0)
  })

  it('should mark the active Contactos nav link with aria-current="page"', () => {
    // GIVEN: Navigation shell rendered with /contactos as the active route
    renderAtRoute('/contactos')

    // THEN: The Contactos nav link has aria-current="page"
    expect(screen.getByTestId('nav-link-contactos')).toHaveAttribute('aria-current', 'page')
  })
})

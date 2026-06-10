/**
 * Story 1.2: Frontend Navigation Shell
 * Edge Case & Boundary Tests — ARIA & Active State (Unit/Component level)
 *
 * Covers:
 *   - ARIA attributes: exact aria-label values on desktop and mobile nav items
 *   - Active state: aria-current on both nav items simultaneously (mutual exclusion)
 *   - ARIA landmark role and label for navigation elements
 *   - Mobile ARIA labels and active-state parity
 *
 * Breakpoint boundary and hook lifecycle tests are in root.breakpoint.test.tsx.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

function mockDesktop() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('1024') ? true : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function mockMobile() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  window.matchMedia = vi.fn().mockImplementation((_query: string) => ({
    matches: false,
    media: _query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop navigation: ARIA attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('DesktopNavigationSidebar — ARIA labels', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P1] nav-item-clientes has aria-label "Ir a Clientes" on desktop', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const item = await screen.findByTestId('nav-item-clientes')

    // THEN: aria-label is in Spanish and correct
    expect(item).toHaveAttribute('aria-label', 'Ir a Clientes')
  })

  test('[P1] nav-item-contactos has aria-label "Ir a Contactos" on desktop', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const item = await screen.findByTestId('nav-item-contactos')

    // THEN: aria-label is in Spanish and correct
    expect(item).toHaveAttribute('aria-label', 'Ir a Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Desktop navigation: active state (aria-current)
// ─────────────────────────────────────────────────────────────────────────────

describe('DesktopNavigationSidebar — Active state (aria-current)', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P1] nav-item-clientes has aria-current="page" when on /clientes', async () => {
    // GIVEN: User is on /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const item = await screen.findByTestId('nav-item-clientes')

    // THEN: Active state is set
    expect(item).toHaveAttribute('aria-current', 'page')
  })

  test('[P1] nav-item-contactos does NOT have aria-current when on /clientes', async () => {
    // GIVEN: User is on /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const item = await screen.findByTestId('nav-item-contactos')

    // THEN: Contactos item is NOT active (mutual exclusion)
    expect(item).not.toHaveAttribute('aria-current', 'page')
  })

  test('[P1] nav-item-contactos has aria-current="page" when on /contactos', async () => {
    // GIVEN: User is on /contactos
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const item = await screen.findByTestId('nav-item-contactos')

    // THEN: Active state is set
    expect(item).toHaveAttribute('aria-current', 'page')
  })

  test('[P1] nav-item-clientes does NOT have aria-current when on /contactos', async () => {
    // GIVEN: User is on /contactos
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const item = await screen.findByTestId('nav-item-clientes')

    // THEN: Clientes item is NOT active (mutual exclusion)
    expect(item).not.toHaveAttribute('aria-current', 'page')
  })

  test('[P2] neither nav item has aria-current on 404 (unknown route)', async () => {
    // GIVEN: User is on an unknown route
    const router = createTestRouter('/ruta-desconocida')
    render(<RouterProvider router={router} />)

    // WHEN: 404 view renders (navigation-rail still present in root layout)
    // Wait for router to settle
    await screen.findByTestId('not-found-view')

    // THEN: Neither nav item should be active (no prefix match)
    // navigation-rail may not render on 404 since notFoundComponent replaces the Outlet
    // We just verify no spurious active state
    const clientesItem = screen.queryByTestId('nav-item-clientes')
    const contactosItem = screen.queryByTestId('nav-item-contactos')

    if (clientesItem) {
      expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
    }
    if (contactosItem) {
      expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Desktop navigation: navigation rail ARIA landmark
// ─────────────────────────────────────────────────────────────────────────────

describe('DesktopNavigationSidebar — ARIA landmark', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] navigation-rail has role="navigation" (via <nav> element)', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const rail = await screen.findByTestId('navigation-rail')

    // THEN: It is a semantic nav element (role=navigation)
    expect(rail.tagName).toBe('NAV')
  })

  test('[P2] navigation-rail has aria-label "Navegación principal"', async () => {
    // GIVEN: Desktop viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationRail renders
    const rail = await screen.findByTestId('navigation-rail')

    // THEN: It has a descriptive aria-label
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mobile navigation: ARIA attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('MobileNavigationBar — ARIA labels and attributes', () => {
  beforeEach(mockMobile)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P1] nav-item-clientes has aria-label "Ir a Clientes" on mobile', async () => {
    // GIVEN: Mobile viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationBar renders
    const item = await screen.findByTestId('nav-item-clientes')

    // THEN: aria-label matches Spanish label
    expect(item).toHaveAttribute('aria-label', 'Ir a Clientes')
  })

  test('[P1] nav-item-contactos has aria-label "Ir a Contactos" on mobile', async () => {
    // GIVEN: Mobile viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationBar renders
    const item = await screen.findByTestId('nav-item-contactos')

    // THEN: aria-label matches Spanish label
    expect(item).toHaveAttribute('aria-label', 'Ir a Contactos')
  })

  test('[P1] nav-item-clientes has aria-current="page" on /clientes (mobile)', async () => {
    // GIVEN: Mobile viewport, user on /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationBar renders
    const item = await screen.findByTestId('nav-item-clientes')

    // THEN: Active state applied on mobile too
    expect(item).toHaveAttribute('aria-current', 'page')
  })

  test('[P1] nav-item-contactos does NOT have aria-current on /clientes (mobile)', async () => {
    // GIVEN: Mobile viewport, user on /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationBar renders
    const item = await screen.findByTestId('nav-item-contactos')

    // THEN: Contactos is NOT active (mutual exclusion on mobile too)
    expect(item).not.toHaveAttribute('aria-current', 'page')
  })

  test('[P2] navigation-bar has role="navigation" (via <nav> element) on mobile', async () => {
    // GIVEN: Mobile viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationBar renders
    const bar = await screen.findByTestId('navigation-bar')

    // THEN: It is a semantic nav element
    expect(bar.tagName).toBe('NAV')
  })

  test('[P2] navigation-bar has aria-label "Navegación principal" on mobile', async () => {
    // GIVEN: Mobile viewport
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: NavigationBar renders
    const bar = await screen.findByTestId('navigation-bar')

    // THEN: It has a descriptive aria-label
    expect(bar).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary: exactly 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary — innerWidth exactly 1024px', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    // At exactly 1024 the condition is >= 1024 → desktop
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] renders navigation-rail (desktop) at exactly 1024px wide', async () => {
    // GIVEN: Viewport is exactly at the breakpoint boundary (1024px)
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: App renders
    // THEN: Desktop rail is shown (>= 1024 → desktop)
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary: 1023px (one pixel below the threshold → mobile)
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary — innerWidth 1023px (one below threshold)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1023 })
    // At 1023 the condition < 1024 → mobile
    window.matchMedia = vi.fn().mockImplementation((_query: string) => ({
      matches: false,
      media: _query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] renders navigation-bar (mobile) at 1023px wide', async () => {
    // GIVEN: Viewport is one pixel below the desktop threshold (1023px → mobile)
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: App renders
    // THEN: Mobile bar is shown (< 1024 → mobile)
    const bar = await screen.findByTestId('navigation-bar')
    expect(bar).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Route rendering: both views render the correct data-testid
// ─────────────────────────────────────────────────────────────────────────────

describe('Route views — content integrity', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] clientes-view contains text "Clientes"', async () => {
    // GIVEN: User is on /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: ClientesView renders
    const view = await screen.findByTestId('clientes-view')

    // THEN: It contains the placeholder text
    expect(view).toHaveTextContent('Clientes')
  })

  test('[P2] contactos-view contains text "Contactos"', async () => {
    // GIVEN: User is on /contactos
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    // WHEN: ContactosView renders
    const view = await screen.findByTestId('contactos-view')

    // THEN: It contains the placeholder text
    expect(view).toHaveTextContent('Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useIsDesktop: matchMedia addEventListener is called on mount
// ─────────────────────────────────────────────────────────────────────────────

describe('useIsDesktop hook — event listener lifecycle', () => {
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] matchMedia addEventListener is called on mount to track breakpoint changes', async () => {
    // GIVEN: Desktop viewport
    const addEventListenerMock = vi.fn()
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: App renders
    await screen.findByTestId('navigation-rail')

    // THEN: addEventListener was called to register the breakpoint listener
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
  })

  test('[P2] matchMedia is called with min-width: 1024px query', async () => {
    // GIVEN: Desktop viewport
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.matchMedia = matchMediaMock

    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: App renders
    await screen.findByTestId('navigation-rail')

    // THEN: matchMedia was called with the correct breakpoint query
    expect(matchMediaMock).toHaveBeenCalledWith(expect.stringContaining('1024'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Redirect: / redirects and preserves navigation structure
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — navigation shell preserved after redirect', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P1] navigation-rail is visible after redirect from / to /clientes', async () => {
    // GIVEN: User accesses root /
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    // WHEN: Redirect to /clientes occurs
    await screen.findByTestId('clientes-view')

    // THEN: Navigation shell is also rendered
    const rail = screen.queryByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  test('[P1] both nav items rendered after redirect from / to /clientes', async () => {
    // GIVEN: User accesses root /
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    // WHEN: Redirect occurs and clientes-view appears
    await screen.findByTestId('clientes-view')

    // THEN: Both nav items are present in the navigation
    await waitFor(() => {
      expect(screen.queryByTestId('nav-item-clientes')).toBeInTheDocument()
      expect(screen.queryByTestId('nav-item-contactos')).toBeInTheDocument()
    })
  })
})

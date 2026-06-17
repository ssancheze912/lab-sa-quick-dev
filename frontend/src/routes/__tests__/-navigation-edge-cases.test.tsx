/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Expanded Component Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate workflow — BMad-Integrated Mode
 * Expands beyond ATDD component tests with edge cases, boundary conditions,
 * and error paths NOT covered in -navigation.test.tsx or navigation.test.tsx.
 *
 * Test categories:
 *   - useIsDesktop hook boundary behavior (exactly 1024px)
 *   - NavItem href attributes
 *   - Multiple nav items text content and labels
 *   - Active state for sub-paths (e.g., /clientes/123)
 *   - Outlet rendering in main content area
 *   - ARIA structure: nav landmark present
 *   - Both nav items are <a> tags (keyboard accessible)
 *   - No-active-route scenario (neutral state)
 *   - navItems structure integrity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─────────────────────────────────────────────────────────────────────────────
// Module-level mock setup — must be hoisted before import
// ─────────────────────────────────────────────────────────────────────────────

const currentPath = vi.hoisted(() => ({ value: '/clientes' }))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useRouterState: () => ({
      location: { pathname: currentPath.value },
    }),
    Outlet: () => <div data-testid="outlet-content">outlet</div>,
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string
      children: React.ReactNode
      [key: string]: unknown
    }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

import { AppLayout } from '../-app-layout'

// ─────────────────────────────────────────────────────────────────────────────
// Viewport helpers — mirrors the matchMedia mock in setup.ts
// ─────────────────────────────────────────────────────────────────────────────

function setMatchMedia(isDesktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 1024px') ? isDesktop : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

function setInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
}

function setupDesktop() {
  setInnerWidth(1280)
  setMatchMedia(true)
}

function setupMobile() {
  setInnerWidth(375)
  setMatchMedia(false)
}

function setupBoundary() {
  // Exactly 1024px — should behave as desktop (>= 1024)
  setInnerWidth(1024)
  setMatchMedia(true)
}

function setupBelowBoundary() {
  // 1023px — should behave as mobile (< 1024)
  setInnerWidth(1023)
  setMatchMedia(false)
}

// ─────────────────────────────────────────────────────────────────────────────
// Boundary conditions for viewport detection
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useIsDesktop — viewport boundary at 1024px', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should render NavigationRail at exactly 1024px (isDesktop = true)', () => {
    // GIVEN: Viewport is exactly at the lg: breakpoint (1024px)
    setupBoundary()
    currentPath.value = '/clientes'

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: NavigationRail is in the DOM (desktop mode)
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
  })

  it('should render NavigationBar at exactly 1023px (isDesktop = false)', () => {
    // GIVEN: Viewport is 1 pixel below the lg: breakpoint (1023px)
    setupBelowBoundary()
    currentPath.value = '/clientes'

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: NavigationBar is in the DOM (mobile mode)
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NavItem href attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Navigation items — href attributes for correct routing', () => {
  beforeEach(() => {
    currentPath.value = '/clientes'
    setupDesktop()
  })
  afterEach(() => vi.restoreAllMocks())

  it('Clientes nav item should have href="/clientes"', () => {
    // GIVEN: Desktop layout rendered
    render(<AppLayout />)

    // THEN: The Clientes item links to /clientes
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('href', '/clientes')
  })

  it('Contactos nav item should have href="/contactos"', () => {
    // GIVEN: Desktop layout rendered
    render(<AppLayout />)

    // THEN: The Contactos item links to /contactos
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('href', '/contactos')
  })

  it('nav items should be anchor <a> elements for keyboard accessibility', () => {
    // GIVEN: Desktop layout rendered
    render(<AppLayout />)

    // THEN: Both nav items are <a> elements
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    expect(clientesItem.tagName.toLowerCase()).toBe('a')
    expect(contactosItem.tagName.toLowerCase()).toBe('a')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Active state for sub-paths (e.g., /clientes/123)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Active state — sub-path matching', () => {
  beforeEach(() => setupDesktop())
  afterEach(() => vi.restoreAllMocks())

  it('should mark Clientes as active when on /clientes/123 (sub-path)', () => {
    // GIVEN: Current route is a sub-path of /clientes
    currentPath.value = '/clientes/123'

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: Clientes item is marked as active (startsWith('/clientes') is true)
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-current', 'page')
  })

  it('should mark Contactos as active when on /contactos/456 (sub-path)', () => {
    // GIVEN: Current route is a sub-path of /contactos
    currentPath.value = '/contactos/456'

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: Contactos item is marked as active
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT mark any item as active for an unknown route', () => {
    // GIVEN: Current route is an unknown path (not /clientes or /contactos)
    currentPath.value = '/unknown-route'

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: Neither nav item has aria-current="page"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ARIA attributes on navigation items
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ARIA labels on navigation items', () => {
  beforeEach(() => {
    currentPath.value = '/clientes'
    setupDesktop()
  })
  afterEach(() => vi.restoreAllMocks())

  it('Clientes nav item should have aria-label="Clientes"', () => {
    // GIVEN: Desktop layout rendered
    render(<AppLayout />)

    // THEN: The Clientes item has the correct aria-label in Spanish
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-label', 'Clientes')
  })

  it('Contactos nav item should have aria-label="Contactos"', () => {
    // GIVEN: Desktop layout rendered
    render(<AppLayout />)

    // THEN: The Contactos item has the correct aria-label in Spanish
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('aria-label', 'Contactos')
  })

  it('active item should have aria-current="page"', () => {
    // GIVEN: User is on /clientes
    render(<AppLayout />)

    // THEN: The Clientes item has aria-current="page"
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
  })

  it('inactive item should NOT have aria-current attribute', () => {
    // GIVEN: User is on /clientes
    render(<AppLayout />)

    // THEN: Contactos does NOT have aria-current at all (not just not "page")
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('aria-current')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation landmark structure
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Navigation landmark — <nav> element presence', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should render a <nav> element on desktop (NavigationRail)', () => {
    // GIVEN: Desktop layout
    currentPath.value = '/clientes'
    setupDesktop()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: A <nav> element exists in the DOM
    const navElement = document.querySelector('nav')
    expect(navElement).not.toBeNull()
  })

  it('should render a <nav> element on mobile (NavigationBar)', () => {
    // GIVEN: Mobile layout
    currentPath.value = '/clientes'
    setupMobile()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: A <nav> element exists in the DOM
    const navElement = document.querySelector('nav')
    expect(navElement).not.toBeNull()
  })

  it('NavigationRail should have aria-label="Navegación principal" on desktop', () => {
    // GIVEN: Desktop layout
    currentPath.value = '/clientes'
    setupDesktop()
    render(<AppLayout />)

    // THEN: The rail has the correct label
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })

  it('NavigationBar should have aria-label="Navegación principal" on mobile', () => {
    // GIVEN: Mobile layout
    currentPath.value = '/clientes'
    setupMobile()
    render(<AppLayout />)

    // THEN: The bar has the correct label
    const bar = screen.getByTestId('navigation-bar')
    expect(bar).toHaveAttribute('aria-label', 'Navegación principal')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Outlet rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Outlet — child route content area', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should render the Outlet inside main content on desktop', () => {
    // GIVEN: Desktop layout with /clientes
    currentPath.value = '/clientes'
    setupDesktop()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Outlet (mocked) renders its content
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
  })

  it('should render the Outlet inside main content on mobile', () => {
    // GIVEN: Mobile layout with /contactos
    currentPath.value = '/contactos'
    setupMobile()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Outlet is still rendered (layout wraps content, not replaces it)
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation text content
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Navigation items — text content and Spanish labels', () => {
  afterEach(() => vi.restoreAllMocks())

  it('both navigation items should display Spanish text labels on desktop', () => {
    // GIVEN: Desktop layout
    currentPath.value = '/clientes'
    setupDesktop()
    render(<AppLayout />)

    // THEN: Navigation labels are in Spanish
    expect(screen.getByTestId('nav-item-clientes')).toHaveTextContent('Clientes')
    expect(screen.getByTestId('nav-item-contactos')).toHaveTextContent('Contactos')
  })

  it('both navigation items should display Spanish text labels on mobile', () => {
    // GIVEN: Mobile layout
    currentPath.value = '/clientes'
    setupMobile()
    render(<AppLayout />)

    // THEN: Navigation labels are in Spanish on mobile too
    expect(screen.getByTestId('nav-item-clientes')).toHaveTextContent('Clientes')
    expect(screen.getByTestId('nav-item-contactos')).toHaveTextContent('Contactos')
  })

  it('should NOT render any English text in navigation items', () => {
    // GIVEN: Desktop layout
    currentPath.value = '/clientes'
    setupDesktop()
    render(<AppLayout />)

    // THEN: No English terms appear in nav items (company standard: Spanish only)
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    expect(clientesItem.textContent).not.toMatch(/^Clients?$/i)
    expect(contactosItem.textContent).not.toMatch(/^Contacts?$/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mutual exclusivity of navigation modes
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Mutual exclusivity — only one navigation mode renders at a time', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should render ONLY NavigationRail on desktop (no NavigationBar)', () => {
    // GIVEN: Desktop viewport
    currentPath.value = '/clientes'
    setupDesktop()
    render(<AppLayout />)

    // THEN: Rail exists, Bar does not exist at all
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
  })

  it('should render ONLY NavigationBar on mobile (no NavigationRail)', () => {
    // GIVEN: Mobile viewport
    currentPath.value = '/clientes'
    setupMobile()
    render(<AppLayout />)

    // THEN: Bar exists, Rail does not exist at all
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useRouterState integration
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useRouterState — route state drives navigation highlighting', () => {
  afterEach(() => vi.restoreAllMocks())

  it('should re-render with updated aria-current when route changes from /clientes to /contactos', () => {
    // GIVEN: Initial render on /clientes
    currentPath.value = '/clientes'
    setupDesktop()
    const { rerender } = render(<AppLayout />)

    // Verify initial active state
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page')

    // WHEN: Route changes to /contactos (simulate by updating mock and re-rendering)
    currentPath.value = '/contactos'
    rerender(<AppLayout />)

    // THEN: Active state updates to Contactos
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page')
  })

  it('should have no active item when route is /unknown', () => {
    // GIVEN: Route is unknown
    currentPath.value = '/unknown'
    setupDesktop()
    render(<AppLayout />)

    // THEN: Neither nav item is active
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page')
  })
})

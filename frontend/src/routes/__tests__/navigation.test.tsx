/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail renders on desktop viewport with correct items
 *   AC2 — NavigationBar renders on mobile viewport with correct items
 *   AC5 — Active item is highlighted when on /clientes or /contactos
 *   AC6 — ARIA label aria-label="Navegación principal" is present
 *
 * Test strategy: Component tests focus on UI behavior in isolation.
 * E2E tests cover routing, deep linking, and 404 (see navigation-shell.spec.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// NOTE: These imports will fail (RED phase) until the files are created
// The AppLayout component does not exist yet — it will be created in _app.tsx
import { AppLayout } from '../_app'

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

// vi.hoisted() runs before vi.mock() hoisting, making the ref available in the factory
const currentPath = vi.hoisted(() => ({ value: '/clientes' }))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useRouterState: () => ({
      location: { pathname: currentPath.value },
    }),
    Outlet: () => <div data-testid="outlet-content">outlet</div>,
  }
})

function mockCurrentPath(pathname: string) {
  currentPath.value = pathname
}

/**
 * Simulates a desktop viewport (>= 1024px) by setting window.innerWidth.
 * Vitest jsdom does not apply CSS media queries, so this helper is for
 * documentation and future integration with matchMedia mocking.
 */
function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  window.dispatchEvent(new Event('resize'))
}

/**
 * Simulates a mobile viewport (< 1024px).
 */
function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  window.dispatchEvent(new Event('resize'))
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail renders on desktop with correct items
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail on desktop', () => {
  beforeEach(() => {
    mockCurrentPath('/clientes')
    setDesktopViewport()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the NavigationRail component', () => {
    // GIVEN: The app layout is rendered on a desktop viewport
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The NavigationRail is in the DOM with the correct data-testid
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })

  it('should render the Clientes navigation item in the NavigationRail', () => {
    // GIVEN: The app layout is rendered on desktop
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Clientes item is visible in the navigation
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
  })

  it('should render the Contactos navigation item in the NavigationRail', () => {
    // GIVEN: The app layout is rendered on desktop
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Contactos item is visible in the navigation
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })

  it('should display "Clientes" text in the navigation item', () => {
    // GIVEN: The app layout is rendered on desktop
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The text "Clientes" is visible
    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('should display "Contactos" text in the navigation item', () => {
    // GIVEN: The app layout is rendered on desktop
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The text "Contactos" is visible
    expect(screen.getByText('Contactos')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — NavigationBar renders on mobile with correct items
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar on mobile', () => {
  beforeEach(() => {
    mockCurrentPath('/clientes')
    setMobileViewport()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the NavigationBar component on mobile', () => {
    // GIVEN: The app layout is rendered on a mobile viewport (375px)
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The NavigationBar is in the DOM with the correct data-testid
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
  })

  it('should render the Clientes navigation item in the NavigationBar', () => {
    // GIVEN: The app layout is rendered on mobile
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Clientes item is present
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
  })

  it('should render the Contactos navigation item in the NavigationBar', () => {
    // GIVEN: The app layout is rendered on mobile
    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Contactos item is present
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Active item is highlighted for current route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Active navigation item highlighting', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should mark Clientes item as active (aria-current="page") when on /clientes', () => {
    // GIVEN: The current route is /clientes
    mockCurrentPath('/clientes')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Clientes item has aria-current="page"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT mark Contactos item as active when on /clientes', () => {
    // GIVEN: The current route is /clientes
    mockCurrentPath('/clientes')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Contactos item does NOT have aria-current="page"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('should mark Contactos item as active (aria-current="page") when on /contactos', () => {
    // GIVEN: The current route is /contactos
    mockCurrentPath('/contactos')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Contactos item has aria-current="page"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT mark Clientes item as active when on /contactos', () => {
    // GIVEN: The current route is /contactos
    mockCurrentPath('/contactos')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The Clientes item does NOT have aria-current="page"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — WCAG 2.1 AA ARIA labels in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — ARIA labels and accessibility', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have aria-label="Navegación principal" on the navigation wrapper', () => {
    // GIVEN: The app layout is rendered
    mockCurrentPath('/clientes')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: The navigation wrapper element has the correct ARIA label in Spanish
    const navWrapper = screen.getByLabelText('Navegación principal')
    expect(navWrapper).toBeInTheDocument()
  })

  it('should render navigation items as links (anchor tags or role="link")', () => {
    // GIVEN: The app layout is rendered
    mockCurrentPath('/clientes')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: Navigation items are keyboard-navigable links
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const tagName = clientesItem.tagName.toLowerCase()
    const role = clientesItem.getAttribute('role')

    // Must be either an anchor or have role="link" for accessibility
    const isLink = tagName === 'a' || role === 'link'
    expect(isLink).toBe(true)
  })

  it('should render navigation elements within a nav landmark', () => {
    // GIVEN: The app layout is rendered
    mockCurrentPath('/clientes')
    setDesktopViewport()

    // WHEN: AppLayout mounts
    render(<AppLayout />)

    // THEN: There is a <nav> landmark element (WCAG navigation landmark requirement)
    const navLandmark = document.querySelector('nav')
    expect(navLandmark).not.toBeNull()
  })
})

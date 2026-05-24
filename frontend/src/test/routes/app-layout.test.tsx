/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — RED Phase
 *
 * Tests for `_app.tsx` pathless layout:
 *   - NavigationRail visible on desktop viewport (>= 1024px)
 *   - NavigationBar visible on mobile viewport (< 1024px)
 *   - Navigation items ("Clientes", "Contactos") present
 *   - Active state propagated to nav items
 *
 * These tests FAIL until the _app.tsx layout is implemented.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Component stubs used until real implementation exists ────────────────────
// These forward-declare the expected structure so tests fail with clear messages.

// NOTE: When _app.tsx is implemented, replace these imports with:
// import { AppLayout } from '@/routes/_app'
// The tests themselves remain unchanged.

// Minimal stub that mimics the expected _app layout contract.
// Tests fail here because the stub does NOT have data-testid attributes.
function AppLayoutStub({ children }: { children?: React.ReactNode }) {
  // Implementation must render:
  // - [data-testid="navigation-rail"] hidden on mobile, visible on desktop
  // - [data-testid="navigation-bar"]  visible on mobile, hidden on desktop
  // - [data-testid="nav-item-clientes"] inside both nav components
  // - [data-testid="nav-item-contactos"] inside both nav components
  return (
    <div data-testid="app-shell">
      {/* NavigationRail — MISSING: will cause tests to fail */}
      {/* NavigationBar — MISSING: will cause tests to fail */}
      <main>{children}</main>
    </div>
  )
}

// ─── Viewport helpers ─────────────────────────────────────────────────────────

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
  window.dispatchEvent(new Event('resize'))
}

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 812 })
  window.dispatchEvent(new Event('resize'))
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Desktop NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — Desktop NavigationRail (AC1)', () => {
  beforeEach(() => setDesktopViewport())
  afterEach(() => setDesktopViewport()) // restore default

  it('renders the navigation-rail element on desktop viewport', () => {
    // GIVEN: AppLayout is rendered at desktop width (>= 1024px)
    render(<AppLayoutStub />)

    // WHEN: The component mounts
    // THEN: NavigationRail is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeTruthy()
  })

  it('renders a "Clientes" nav item inside the NavigationRail on desktop', () => {
    // GIVEN: AppLayout rendered at desktop width
    render(<AppLayoutStub />)

    // WHEN: Desktop viewport
    // THEN: Clientes nav item is rendered and accessible
    expect(screen.getByTestId('nav-item-clientes')).toBeTruthy()
  })

  it('renders a "Contactos" nav item inside the NavigationRail on desktop', () => {
    // GIVEN: AppLayout rendered at desktop width
    render(<AppLayoutStub />)

    // WHEN: Desktop viewport
    // THEN: Contactos nav item is rendered and accessible
    expect(screen.getByTestId('nav-item-contactos')).toBeTruthy()
  })

  it('nav items have accessible text labels in Spanish', () => {
    // GIVEN: AppLayout rendered at desktop width
    render(<AppLayoutStub />)

    // WHEN: The nav items are rendered
    // THEN: Labels "Clientes" and "Contactos" are present (Spanish)
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(clientesItem.textContent).toMatch(/Clientes/i)
    expect(contactosItem.textContent).toMatch(/Contactos/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Mobile NavigationBar
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — Mobile NavigationBar (AC2)', () => {
  beforeEach(() => setMobileViewport())
  afterEach(() => setDesktopViewport()) // restore after each

  it('renders the navigation-bar element on mobile viewport', () => {
    // GIVEN: AppLayout is rendered at mobile width (< 1024px)
    render(<AppLayoutStub />)

    // WHEN: Mobile viewport
    // THEN: NavigationBar is present in the DOM
    expect(screen.getByTestId('navigation-bar')).toBeTruthy()
  })

  it('renders a "Clientes" nav item inside the NavigationBar on mobile', () => {
    // GIVEN: AppLayout rendered at mobile width
    render(<AppLayoutStub />)

    // WHEN: Mobile viewport
    // THEN: Clientes nav item is present in the bottom bar
    expect(screen.getByTestId('nav-item-clientes')).toBeTruthy()
  })

  it('renders a "Contactos" nav item inside the NavigationBar on mobile', () => {
    // GIVEN: AppLayout rendered at mobile width
    render(<AppLayoutStub />)

    // WHEN: Mobile viewport
    // THEN: Contactos nav item is present in the bottom bar
    expect(screen.getByTestId('nav-item-contactos')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Active nav item highlighting (component level)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — Active navigation item (AC5)', () => {
  beforeEach(() => setDesktopViewport())
  afterEach(() => setDesktopViewport())

  it('sets data-active="true" on the Clientes nav item when activePath is /clientes', () => {
    // GIVEN: AppLayout rendered with activePath="/clientes"
    // The real _app.tsx must accept or derive activePath from TanStack Router state
    render(<AppLayoutStub />)

    // WHEN: The active route is /clientes
    // THEN: nav-item-clientes has data-active="true"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('data-active', 'true')
  })

  it('does NOT set data-active="true" on Contactos when activePath is /clientes', () => {
    // GIVEN: AppLayout rendered with activePath="/clientes"
    render(<AppLayoutStub />)

    // WHEN: Active route is /clientes
    // THEN: nav-item-contactos does NOT have data-active="true"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('data-active', 'true')
  })
})

/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Root Layout Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on lg breakpoint (desktop ≥ 1024px)
 *   AC2 — NavigationBar visible on mobile (< 1024px), NavigationRail hidden
 *   AC5 — Spanish aria-labels on nav items
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderAppAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail is present in the shell
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail (viewport ≥ 1024px)', () => {
  it('should render an element with data-testid="navigation-rail" when the shell is loaded', () => {
    // GIVEN: The root layout with shell is rendered
    // WHEN: The app is loaded at /clientes
    renderAppAt('/clientes')

    // THEN: NavigationRail element is present in the DOM (may be hidden on mobile via CSS)
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  it('should render "Clientes" nav item in the shell', () => {
    // GIVEN: The root layout is rendered
    // WHEN: The shell mounts
    renderAppAt('/clientes')

    // THEN: Clientes nav item is present
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toBeInTheDocument()
  })

  it('should render "Contactos" nav item in the shell', () => {
    // GIVEN: The root layout is rendered
    // WHEN: The shell mounts
    renderAppAt('/clientes')

    // THEN: Contactos nav item is present
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toBeInTheDocument()
  })

  it('should have data-testid="navigation-rail" element in the shell at /contactos', () => {
    // GIVEN: The root layout is rendered
    // WHEN: The app is at /contactos
    renderAppAt('/contactos')

    // THEN: NavigationRail element is present
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar is present in the shell DOM
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar exists in the shell', () => {
  it('should render an element with data-testid="navigation-bar" in the shell', () => {
    // GIVEN: The root layout is rendered
    // WHEN: The app mounts (mobile vs desktop is controlled by CSS, not JS)
    renderAppAt('/clientes')

    // THEN: NavigationBar element is present in DOM (hidden on desktop via Tailwind CSS)
    const bar = screen.getByTestId('navigation-bar')
    expect(bar).toBeInTheDocument()
  })

  it('should have navigation items in NavigationBar (mobile nav)', () => {
    // GIVEN: The root layout is rendered
    // WHEN: The shell mounts
    renderAppAt('/clientes')

    // THEN: Both nav items exist (shared between rail and bar or duplicated per responsive design)
    const navItems = screen.getAllByTestId(/nav-item-/)
    expect(navItems.length).toBeGreaterThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Accessibility: Spanish aria-labels on nav items
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Spanish aria-labels on navigation items', () => {
  it('should have aria-label="Ir a Clientes" on the Clientes nav item', () => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A screen reader inspects the Clientes nav item
    renderAppAt('/clientes')

    // THEN: Clientes nav item has Spanish aria-label
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes')
  })

  it('should have aria-label="Ir a Contactos" on the Contactos nav item', () => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A screen reader inspects the Contactos nav item
    renderAppAt('/clientes')

    // THEN: Contactos nav item has Spanish aria-label
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos')
  })

  it('should have nav items reachable by keyboard (non-negative tabIndex or naturally focusable)', () => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A keyboard user inspects the nav items
    renderAppAt('/clientes')

    const clientesItem = screen.getByTestId('nav-item-clientes')
    const tabIndex = clientesItem.getAttribute('tabindex')

    // THEN: tabindex is null (naturally focusable) or >= 0 (explicitly set)
    expect(tabIndex === null || parseInt(tabIndex) >= 0).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Active state reflects current route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Active nav item reflects current route', () => {
  it('should mark Clientes nav item as active when on /clientes', () => {
    // GIVEN: User navigates to /clientes
    // WHEN: Shell renders
    renderAppAt('/clientes')

    // THEN: Clientes nav item has data-active="true"
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('data-active', 'true')
  })

  it('should mark Contactos nav item as active when on /contactos', () => {
    // GIVEN: User navigates to /contactos
    // WHEN: Shell renders
    renderAppAt('/contactos')

    // THEN: Contactos nav item has data-active="true"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('data-active', 'true')
  })

  it('should NOT mark Contactos as active when on /clientes', () => {
    // GIVEN: User is on /clientes
    renderAppAt('/clientes')

    // THEN: Contactos nav item is NOT active
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('data-active', 'true')
  })
})

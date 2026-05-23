/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Root Layout Shell
 *
 * ATDD Acceptance Tests
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on lg breakpoint (desktop ≥ 1024px)
 *   AC2 — NavigationBar visible on mobile (< 1024px), NavigationRail hidden
 *   AC5 — Spanish aria-labels on nav items
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

async function renderAppAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail is present in the shell
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Desktop NavigationRail (viewport ≥ 1024px)', () => {
  it('should render an element with data-testid="navigation-rail" when the shell is loaded', async () => {
    // GIVEN: The root layout with shell is rendered
    // WHEN: The app is loaded at /clientes
    await renderAppAt('/clientes')

    // THEN: NavigationRail element is present in the DOM (may be hidden on mobile via CSS)
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  it('should render "Clientes" nav item in the shell', async () => {
    // GIVEN: The root layout is rendered
    // WHEN: The shell mounts
    await renderAppAt('/clientes')

    // THEN: Clientes nav item is present
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should render "Contactos" nav item in the shell', async () => {
    // GIVEN: The root layout is rendered
    // WHEN: The shell mounts
    await renderAppAt('/clientes')

    // THEN: Contactos nav item is present
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should have data-testid="navigation-rail" element in the shell at /contactos', async () => {
    // GIVEN: The root layout is rendered
    // WHEN: The app is at /contactos
    await renderAppAt('/contactos')

    // THEN: NavigationRail element is present
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Mobile: NavigationBar is present in the shell DOM
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Mobile NavigationBar exists in the shell', () => {
  beforeEach(() => {
    // Simulate mobile viewport (< 768px) for jsdom
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 })
    window.dispatchEvent(new Event('resize'))
  })

  afterEach(() => {
    // Restore default jsdom width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    window.dispatchEvent(new Event('resize'))
  })

  it('should render an element with data-testid="navigation-bar" in the shell', async () => {
    // GIVEN: The root layout is rendered on mobile viewport (< 768px)
    // WHEN: The app mounts with mobile viewport
    await renderAppAt('/clientes')

    // THEN: NavigationBar element is present in DOM (only mobile nav rendered on mobile viewport)
    const bar = screen.getByTestId('navigation-bar')
    expect(bar).toBeInTheDocument()
  })

  it('should have navigation items in NavigationBar (mobile nav)', async () => {
    // GIVEN: The root layout is rendered on mobile viewport
    // WHEN: The shell mounts
    await renderAppAt('/clientes')

    // THEN: Both nav items exist in mobile navigation bar
    const navItems = screen.getAllByTestId(/nav-item-/)
    expect(navItems.length).toBeGreaterThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Accessibility: Spanish aria-labels on nav items
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Spanish aria-labels on navigation items', () => {
  it('should have aria-label="Ir a Clientes" on the Clientes nav item', async () => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A screen reader inspects the Clientes nav item
    await renderAppAt('/clientes')

    // THEN: Clientes nav item has Spanish aria-label
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.length).toBeGreaterThanOrEqual(1)
      expect(clientesItems[0]).toHaveAttribute('aria-label', 'Ir a Clientes')
    })
  })

  it('should have aria-label="Ir a Contactos" on the Contactos nav item', async () => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A screen reader inspects the Contactos nav item
    await renderAppAt('/clientes')

    // THEN: Contactos nav item has Spanish aria-label
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.length).toBeGreaterThanOrEqual(1)
      expect(contactosItems[0]).toHaveAttribute('aria-label', 'Ir a Contactos')
    })
  })

  it('should have nav items reachable by keyboard (non-negative tabIndex or naturally focusable)', async () => {
    // GIVEN: The navigation shell is rendered
    // WHEN: A keyboard user inspects the nav items
    await renderAppAt('/clientes')

    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.length).toBeGreaterThanOrEqual(1)
      const clientesItem = clientesItems[0]
      const tabIndex = clientesItem.getAttribute('tabindex')

      // THEN: tabindex is null (naturally focusable) or >= 0 (explicitly set)
      expect(tabIndex === null || parseInt(tabIndex) >= 0).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Active state reflects current route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Active nav item reflects current route', () => {
  it('should mark Clientes nav item as active when on /clientes', async () => {
    // GIVEN: User navigates to /clientes
    // WHEN: Shell renders
    await renderAppAt('/clientes')

    // THEN: At least one Clientes nav item has data-active="true"
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      const activeItem = clientesItems.find(el => el.getAttribute('data-active') === 'true')
      expect(activeItem).toBeDefined()
    })
  })

  it('should mark Contactos nav item as active when on /contactos', async () => {
    // GIVEN: User navigates to /contactos
    // WHEN: Shell renders
    await renderAppAt('/contactos')

    // THEN: At least one Contactos nav item has data-active="true"
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      const activeItem = contactosItems.find(el => el.getAttribute('data-active') === 'true')
      expect(activeItem).toBeDefined()
    })
  })

  it('should NOT mark Contactos as active when on /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderAppAt('/clientes')

    // THEN: No Contactos nav item is active
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      const activeItem = contactosItems.find(el => el.getAttribute('data-active') === 'true')
      expect(activeItem).toBeUndefined()
    })
  })
})

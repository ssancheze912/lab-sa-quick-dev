/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Root Layout Shell
 *
 * ATDD Acceptance Tests + Edge Cases
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on lg breakpoint (desktop ≥ 1024px)
 *   AC2 — NavigationBar visible on mobile (viewport < 1024px), NavigationRail hidden
 *   AC3 — Active nav state reflects current route
 *   AC5 — Spanish aria-labels on nav items
 *
 * Edge Cases:
 *   - Root route / renders without crashing
 *   - Conditional rendering: NavigationBar NOT in DOM on desktop
 *   - Conditional rendering: NavigationRail NOT in DOM on mobile
 *   - aria-current="page" on active item (WCAG)
 *   - aria-current absent on inactive item
 *   - Clientes nav not active when on /contactos
 *   - Space key handler on nav links dispatches click
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
    // Simulate mobile viewport (< 1024px) for jsdom
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 })
    window.dispatchEvent(new Event('resize'))
  })

  afterEach(() => {
    // Restore desktop jsdom width (>= 1024px)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.dispatchEvent(new Event('resize'))
  })

  it('should render an element with data-testid="navigation-bar" in the shell', async () => {
    // GIVEN: The root layout is rendered on mobile viewport (< 1024px)
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

  it('should NOT mark Clientes as active when on /contactos', async () => {
    // GIVEN: User is on /contactos
    await renderAppAt('/contactos')

    // THEN: No Clientes nav item is active
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      const activeItem = clientesItems.find(el => el.getAttribute('data-active') === 'true')
      expect(activeItem).toBeUndefined()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Root route / renders without crashing
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Root route / renders without crashing', () => {
  it('should render the app at / without throwing', async () => {
    // GIVEN: The router is initialised at the root path
    // WHEN: The app mounts at /
    await renderAppAt('/')

    // THEN: The navigation shell is still present (nav renders on all routes)
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  it('should render the IndexPage content at /', async () => {
    // GIVEN: The router renders at /
    await renderAppAt('/')

    // THEN: The index page heading is visible
    await waitFor(() => {
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Conditional rendering — only ONE nav component in DOM per viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Conditional rendering: only one nav component per viewport', () => {
  it('should NOT have NavigationBar in DOM on desktop (conditional, not CSS-hidden)', async () => {
    // GIVEN: jsdom default window.innerWidth is 1024 (desktop)
    // WHEN: The shell renders on desktop
    await renderAppAt('/clientes')

    // THEN: NavigationBar element is not present at all in the DOM
    expect(screen.queryByTestId('navigation-bar')).toBeNull()
  })

  it('should NOT have NavigationRail in DOM on mobile (conditional, not CSS-hidden)', async () => {
    // GIVEN: Simulated mobile viewport (< 1024px)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 })
    window.dispatchEvent(new Event('resize'))

    // WHEN: The shell renders on mobile
    await renderAppAt('/clientes')

    // THEN: NavigationRail is not present in the DOM at all
    expect(screen.queryByTestId('navigation-rail')).toBeNull()

    // Restore
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.dispatchEvent(new Event('resize'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: aria-current attribute for WCAG compliance
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — aria-current attribute (WCAG active state)', () => {
  it('should set aria-current="page" on the active Clientes nav item at /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderAppAt('/clientes')

    // THEN: The active Clientes nav item exposes aria-current="page"
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      const currentItem = clientesItems.find(el => el.getAttribute('aria-current') === 'page')
      expect(currentItem).toBeDefined()
    })
  })

  it('should set aria-current="page" on the active Contactos nav item at /contactos', async () => {
    // GIVEN: User is on /contactos
    await renderAppAt('/contactos')

    // THEN: The active Contactos nav item exposes aria-current="page"
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      const currentItem = contactosItems.find(el => el.getAttribute('aria-current') === 'page')
      expect(currentItem).toBeDefined()
    })
  })

  it('should NOT set aria-current on inactive nav items', async () => {
    // GIVEN: User is on /clientes
    await renderAppAt('/clientes')

    // THEN: Contactos items do not have aria-current="page"
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      const wrongCurrent = contactosItems.find(el => el.getAttribute('aria-current') === 'page')
      expect(wrongCurrent).toBeUndefined()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Space key activates nav items (WCAG 2.1 AA — anchor Space handler)
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Space key activates nav item (onKeyDown handler)', () => {
  it('should call click() when Space is pressed on a nav item anchor', async () => {
    // GIVEN: Shell is rendered
    await renderAppAt('/contactos')

    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.length).toBeGreaterThanOrEqual(1)
    })

    const clientesItem = screen.getAllByTestId('nav-item-clientes')[0]
    const clickSpy = vi.spyOn(clientesItem, 'click').mockImplementation(() => {})

    // WHEN: Space keydown fires on the nav item
    fireEvent.keyDown(clientesItem, { key: ' ' })

    // THEN: click() is called (the handler triggers navigation)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    clickSpy.mockRestore()
  })

  it('should NOT call click() when a non-Space key is pressed on a nav item', async () => {
    // GIVEN: Shell is rendered
    await renderAppAt('/clientes')

    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      expect(items.length).toBeGreaterThanOrEqual(1)
    })

    const contactosItem = screen.getAllByTestId('nav-item-contactos')[0]
    const clickSpy = vi.spyOn(contactosItem, 'click').mockImplementation(() => {})

    // WHEN: Any other key (e.g. 'a') fires — should not trigger click
    fireEvent.keyDown(contactosItem, { key: 'a' })

    // THEN: click() is NOT called
    expect(clickSpy).not.toHaveBeenCalled()

    clickSpy.mockRestore()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: nav aria-label attribute on shell container
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Nav shell aria-label on container', () => {
  it('should have aria-label="Navegación principal" on the desktop NavigationRail container', async () => {
    // GIVEN: Desktop shell rendered
    await renderAppAt('/clientes')

    // THEN: The nav element carries its accessible label
    const rail = screen.getByTestId('navigation-rail')
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })

  it('should have aria-label on the mobile NavigationBar container', async () => {
    // GIVEN: Mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 })
    window.dispatchEvent(new Event('resize'))

    await renderAppAt('/clientes')

    // THEN: The mobile nav element carries its accessible label
    const bar = screen.getByTestId('navigation-bar')
    expect(bar).toHaveAttribute('aria-label')
    expect(bar.getAttribute('aria-label')).not.toBe('')

    // Restore
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.dispatchEvent(new Event('resize'))
  })
})

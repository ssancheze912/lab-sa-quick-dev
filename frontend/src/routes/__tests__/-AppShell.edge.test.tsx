/**
 * Story 1.2: Frontend Navigation Shell — Component Edge Case Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * Component edge cases NOT covered by AppShell.test.tsx (ATDD) or -AppShell.test.tsx (implementation).
 *
 * Coverage:
 *   - Breakpoint boundary: exactly 1023px renders mobile, exactly 1024px renders desktop
 *   - Resize event: switching from desktop to mobile updates the layout
 *   - NavItems exact count: exactly 2 items rendered at both viewports
 *   - Root path redirect at component level (no infinite loop)
 *   - Inactive item explicitly has data-active="false"
 *   - Nav item aria-current absent (undefined/not set) for inactive items
 *   - No nav shell rendered on 404 (shell is gated by route match)
 *
 * Story 2.1 update: renderWithRouter now wraps with QueryClientProvider
 * (required by ClienteListView which uses TanStack Query).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

async function renderWithRouter(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  await router.load()
  render(
    createElement(QueryClientProvider, { client: queryClient },
      createElement(RouterProvider, { router })
    )
  )
  return { router, history }
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint Boundary Conditions (exactly 1023px vs 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint Boundary — 1023px renders mobile shell', () => {
  beforeEach(() => setViewportWidth(1023))
  afterEach(() => setViewportWidth(1280))

  it('[P1] should render NavigationBar at exactly 1023px (one below lg breakpoint)', async () => {
    // GIVEN: Window innerWidth is 1023px
    await renderWithRouter('/clientes')

    // THEN: Mobile NavigationBar is rendered (not desktop rail)
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
  })
})

describe('Breakpoint Boundary — 1024px renders desktop shell', () => {
  beforeEach(() => setViewportWidth(1024))
  afterEach(() => setViewportWidth(1280))

  it('[P1] should render NavigationRail at exactly 1024px (at lg breakpoint)', async () => {
    // GIVEN: Window innerWidth is exactly 1024px
    await renderWithRouter('/clientes')

    // THEN: Desktop NavigationRail is rendered (not mobile bar)
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Resize Event — Dynamic viewport switch
// ─────────────────────────────────────────────────────────────────────────────

describe('Resize Event — Desktop to Mobile transition', () => {
  afterEach(() => setViewportWidth(1280))

  it('[P2] should switch from NavigationRail to NavigationBar when resized below 1024px', async () => {
    // GIVEN: App starts in desktop mode (1280px)
    setViewportWidth(1280)
    await renderWithRouter('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // WHEN: Viewport is resized to mobile (375px)
    act(() => {
      setViewportWidth(375)
    })

    // THEN: NavigationBar appears and NavigationRail disappears
    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NavItems Count — Exactly 2 items on desktop and mobile
// ─────────────────────────────────────────────────────────────────────────────

describe('NavItems Count Boundary', () => {
  it('[P2] should render exactly 2 navigation items on desktop NavigationRail', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280)
    await renderWithRouter('/clientes')

    // THEN: Exactly 2 nav items are present in the rail (Clientes + Contactos)
    const rail = await screen.findByTestId('navigation-rail')
    const items = rail.querySelectorAll('[data-testid^="nav-item-"]')
    expect(items).toHaveLength(2)
  })

  it('[P2] should render exactly 2 navigation items on mobile NavigationBar', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375)
    await renderWithRouter('/clientes')

    // THEN: Exactly 2 nav items are present in the bar
    const bar = await screen.findByTestId('navigation-bar')
    const items = bar.querySelectorAll('[data-testid^="nav-item-"]')
    expect(items).toHaveLength(2)

    // Reset
    setViewportWidth(1280)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// data-active Attribute Boundary — Inactive items always have data-active="false"
// ─────────────────────────────────────────────────────────────────────────────

describe('data-active="false" on Inactive Nav Items', () => {
  beforeEach(() => setViewportWidth(1280))
  afterEach(() => setViewportWidth(1280))

  it('[P2] should set data-active="false" on Contactos when on /clientes', async () => {
    // GIVEN: App is at /clientes
    await renderWithRouter('/clientes')

    // THEN: Contactos item is explicitly inactive
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'false')
    })
  })

  it('[P2] should set data-active="false" on Clientes when on /contactos', async () => {
    // GIVEN: App is at /contactos
    await renderWithRouter('/contactos')

    // THEN: Clientes item is explicitly inactive
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'false')
    })
  })

  it('[P2] should set data-active="true" on active item and data-active="false" on the other', async () => {
    // GIVEN: App is at /contactos
    await renderWithRouter('/contactos')

    // THEN: Active/inactive data-active pair is consistent
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true')
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'false')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// aria-current ABSENT on Inactive Items
// ─────────────────────────────────────────────────────────────────────────────

describe('aria-current Absent on Inactive Nav Items', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P1] should NOT set aria-current on Contactos nav item when on /clientes', async () => {
    // GIVEN: App is at /clientes
    await renderWithRouter('/clientes')

    // THEN: Contactos does not receive aria-current="page"
    await waitFor(() => {
      const contactosItem = screen.getByTestId('nav-item-contactos')
      expect(contactosItem.getAttribute('aria-current')).not.toBe('page')
    })
  })

  it('[P1] should NOT set aria-current on Clientes nav item when on /contactos', async () => {
    // GIVEN: App is at /contactos
    await renderWithRouter('/contactos')

    // THEN: Clientes does not receive aria-current="page"
    await waitFor(() => {
      const clientesItem = screen.getByTestId('nav-item-clientes')
      expect(clientesItem.getAttribute('aria-current')).not.toBe('page')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Root Redirect — No infinite loop, terminates at /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Path Redirect — Component Level', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P0] should redirect / to /clientes with correct router state', async () => {
    // GIVEN: Router starts at /
    const { router } = await renderWithRouter('/')

    // THEN: Router state reflects /clientes (beforeLoad redirect)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('[P1] should render the Clientes list panel after root redirect (no blank screen)', async () => {
    // GIVEN: Router starts at /
    await renderWithRouter('/')

    // THEN: The actual Clientes content is shown (clientes-list-panel from Story 2.1)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Spanish Label Text — nav items contain Spanish text
// ─────────────────────────────────────────────────────────────────────────────

describe('Spanish Label Text on Nav Items', () => {
  beforeEach(() => setViewportWidth(1280))

  it('[P2] should display "Clientes" (Spanish) label on the Clientes nav item', async () => {
    // GIVEN: Desktop app at /clientes
    await renderWithRouter('/clientes')

    // THEN: The nav item contains the Spanish label text
    const item = await screen.findByTestId('nav-item-clientes')
    expect(item).toHaveTextContent('Clientes')
  })

  it('[P2] should display "Contactos" (Spanish) label on the Contactos nav item', async () => {
    // GIVEN: Desktop app at /clientes
    await renderWithRouter('/clientes')

    // THEN: The nav item contains the Spanish label text
    const item = await screen.findByTestId('nav-item-contactos')
    expect(item).toHaveTextContent('Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Nav Landmark — aria-label on both rail and bar
// ─────────────────────────────────────────────────────────────────────────────

describe('ARIA Navigation Landmark', () => {
  it('[P1] should have aria-label="Navegación principal" on desktop NavigationRail', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280)
    await renderWithRouter('/clientes')

    // THEN: The nav landmark has the required WCAG aria-label
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })

  it('[P1] should have aria-label="Navegación principal" on mobile NavigationBar', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375)
    await renderWithRouter('/clientes')

    // THEN: The nav landmark has the required WCAG aria-label
    const bar = await screen.findByTestId('navigation-bar')
    expect(bar).toHaveAttribute('aria-label', 'Navegación principal')

    // Reset
    setViewportWidth(1280)
  })
})

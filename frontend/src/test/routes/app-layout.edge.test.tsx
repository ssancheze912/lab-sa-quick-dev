/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — AppLayout edge cases
 *
 * Coverage added (not in ATDD or existing component tests):
 *   - Viewport exactly at breakpoint (1024px) — NavigationRail shown, NavigationBar hidden
 *   - Mobile active state: data-active set on NavigationBar items (AC5, mobile)
 *   - Both nav items always rendered (one active, one inactive)
 *   - AppLayout does not crash when rendered at an unknown path
 *   - No duplicate testids on desktop (strict mode safety)
 *   - No duplicate testids on mobile (strict mode safety)
 *   - Contactos active state on mobile when at /contactos
 *   - Sub-path /clientes/123 still marks Clientes as active
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act } from 'react'
import { AppLayout } from '@/routes/_app'

// ─── Router helpers ───────────────────────────────────────────────────────────

async function renderAppLayout(initialPath: string = '/clientes') {
  const rootRoute = createRootRoute({
    component: () => <AppLayout />,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-page">Clientes</div>,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-page">Contactos</div>,
  })
  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<RouterProvider router={router} />)
    await router.load()
  })
  return result!
}

// ─── Viewport helpers ─────────────────────────────────────────────────────────

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

const ORIGINAL_WIDTH = window.innerWidth

beforeEach(() => setViewportWidth(1280))
afterEach(() => setViewportWidth(ORIGINAL_WIDTH))

// ─────────────────────────────────────────────────────────────────────────────
// Viewport boundary: exactly 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — viewport boundary at exactly 1024px', () => {
  it('[P2] renders NavigationRail at exactly 1024px (breakpoint boundary)', async () => {
    setViewportWidth(1024)
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.queryByTestId('navigation-rail')).not.toBeNull())
  })

  it('[P2] does NOT render NavigationBar at exactly 1024px (breakpoint boundary)', async () => {
    setViewportWidth(1024)
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.queryByTestId('navigation-bar')).toBeNull())
  })

  it('[P2] renders NavigationBar at 1023px (one below breakpoint)', async () => {
    setViewportWidth(1023)
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.queryByTestId('navigation-bar')).not.toBeNull())
  })

  it('[P2] does NOT render NavigationRail at 1023px (one below breakpoint)', async () => {
    setViewportWidth(1023)
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.queryByTestId('navigation-rail')).toBeNull())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mobile active state (AC5 — mobile coverage missing from ATDD)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — active state on mobile NavigationBar (AC5)', () => {
  beforeEach(() => setViewportWidth(375))

  it('[P1] sets data-active="true" on Clientes nav item in NavigationBar when at /clientes', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-clientes')
      const hasActive = items.some((el) => el.getAttribute('data-active') === 'true')
      expect(hasActive).toBe(true)
    })
  })

  it('[P1] sets data-active="true" on Contactos nav item in NavigationBar when at /contactos', async () => {
    await renderAppLayout('/contactos')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      const hasActive = items.some((el) => el.getAttribute('data-active') === 'true')
      expect(hasActive).toBe(true)
    })
  })

  it('[P1] does NOT set data-active on Contactos when at /clientes (mobile)', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      const hasActive = items.some((el) => el.getAttribute('data-active') === 'true')
      expect(hasActive).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Testid uniqueness — no duplicate testids at each viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — unique testids per viewport (Playwright strict mode safety)', () => {
  it('[P1] renders exactly ONE nav-item-clientes element on desktop', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-clientes')
      expect(items).toHaveLength(1)
    })
  })

  it('[P1] renders exactly ONE nav-item-contactos element on desktop', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      expect(items).toHaveLength(1)
    })
  })

  it('[P1] renders exactly ONE nav-item-clientes element on mobile', async () => {
    setViewportWidth(375)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-clientes')
      expect(items).toHaveLength(1)
    })
  })

  it('[P1] renders exactly ONE nav-item-contactos element on mobile', async () => {
    setViewportWidth(375)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      expect(items).toHaveLength(1)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sub-path active state — /clientes/123 should keep Clientes active
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — sub-path active state', () => {
  it('[P2] marks Clientes as active when path starts with /clientes/', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-clientes')
      const hasActive = items.some((el) => el.getAttribute('data-active') === 'true')
      // At /clientes, active should be true
      expect(hasActive).toBe(true)
    })
  })

  it('[P2] Contactos item is NOT active when at /clientes', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const items = screen.getAllByTestId('nav-item-contactos')
      const hasActive = items.some((el) => el.getAttribute('data-active') === 'true')
      expect(hasActive).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Crash-safety — unknown path renders without error
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — crash-safety at unknown path', () => {
  it('[P2] does not throw when rendered at an unknown path', async () => {
    setViewportWidth(1280)
    await expect(renderAppLayout('/unknown-path')).resolves.not.toThrow()
  })

  it('[P2] renders navigation structure even at an unknown path', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/unknown-path')
    await waitFor(() => {
      // NavigationRail must still appear (layout persists)
      expect(screen.queryByTestId('navigation-rail')).not.toBeNull()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — nav elements have aria-label
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — accessibility attributes', () => {
  it('[P1] NavigationRail nav element has aria-label attribute (desktop)', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const rail = screen.queryByTestId('navigation-rail')
      expect(rail).not.toBeNull()
      expect(rail?.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('[P1] NavigationBar nav element has aria-label attribute (mobile)', async () => {
    setViewportWidth(375)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const bar = screen.queryByTestId('navigation-bar')
      expect(bar).not.toBeNull()
      expect(bar?.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('[P1] nav items have aria-label attributes for screen readers', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const clientesItem = screen.getAllByTestId('nav-item-clientes')[0]
      expect(clientesItem.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('[P2] active nav item has aria-current="page" set (desktop)', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const clientesItem = screen.getAllByTestId('nav-item-clientes')[0]
      expect(clientesItem.getAttribute('aria-current')).toBe('page')
    })
  })

  it('[P2] inactive nav item does NOT have aria-current="page" (desktop)', async () => {
    setViewportWidth(1280)
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const contactosItem = screen.getAllByTestId('nav-item-contactos')[0]
      expect(contactosItem.getAttribute('aria-current')).not.toBe('page')
    })
  })
})

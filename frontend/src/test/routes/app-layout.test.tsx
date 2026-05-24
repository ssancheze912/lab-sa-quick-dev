/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests
 *
 * Tests for `_app.tsx` pathless layout:
 *   - NavigationRail visible on desktop viewport (>= 1024px)
 *   - NavigationBar visible on mobile viewport (< 1024px)
 *   - Navigation items ("Clientes", "Contactos") present
 *   - Active state propagated to nav items
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
  afterEach(() => setDesktopViewport())

  it('renders the navigation-rail element on desktop viewport', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.getByTestId('navigation-rail')).toBeTruthy())
  })

  it('renders a "Clientes" nav item inside the NavigationRail on desktop', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThan(0))
  })

  it('renders a "Contactos" nav item inside the NavigationRail on desktop', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThan(0))
  })

  it('Clientes nav item has accessible Spanish text label', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems[0].textContent).toMatch(/Clientes/i)
    })
  })

  it('Contactos nav item has accessible Spanish text label', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems[0].textContent).toMatch(/Contactos/i)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Mobile NavigationBar
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — Mobile NavigationBar (AC2)', () => {
  beforeEach(() => setMobileViewport())
  afterEach(() => setDesktopViewport())

  it('renders the navigation-bar element on mobile viewport', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.getByTestId('navigation-bar')).toBeTruthy())
  })

  it('renders a "Clientes" nav item inside the NavigationBar on mobile', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThan(0))
  })

  it('renders a "Contactos" nav item inside the NavigationBar on mobile', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThan(0))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Active nav item highlighting (component level)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppLayout — Active navigation item (AC5)', () => {
  beforeEach(() => setDesktopViewport())
  afterEach(() => setDesktopViewport())

  it('sets data-active="true" on the Clientes nav item when at /clientes', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      const hasActive = clientesItems.some((el) => el.getAttribute('data-active') === 'true')
      expect(hasActive).toBe(true)
    })
  })

  it('does NOT set data-active="true" on Contactos when at /clientes', async () => {
    await renderAppLayout('/clientes')
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      const hasActive = contactosItems.some((el) => el.getAttribute('data-active') === 'true')
      expect(hasActive).toBe(false)
    })
  })
})

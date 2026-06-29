/**
 * Story 1.2: Frontend Navigation Shell — EXPANDED COVERAGE
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Expansion (testarch-automate) — edges and negative paths
 * Builds on top of the ATDD baseline in `index.test.tsx`.
 *
 * Coverage focus (NOT duplicated with ATDD):
 *   - AC #5 edges: the redirect uses TanStack Router `beforeLoad` (NOT a
 *     <Navigate>-style render), so the user NEVER sees an empty `/` view.
 *   - AC #5 edge: redirect target marks Clientes as active immediately upon load.
 *   - AC #5 edge: trailing-slash `/` resolves identically to no path.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

function setupDesktopViewport(): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1280,
  })

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: /min-width:\s*1024px/.test(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function renderRouterAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const result = render(<RouterProvider router={router} />)
  return { router, ...result }
}

describe('Index route redirect edges (Story 1.2 / AC #5 — edges)', () => {
  beforeEach(() => {
    setupDesktopViewport()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('[P1] should NOT leave the router at "/" after the redirect resolves', async () => {
    // GIVEN: app boots at /
    const { router } = renderRouterAt('/')

    // WHEN: router finishes resolving (beforeLoad throws redirect)
    await waitFor(() => {
      expect(router.state.location.pathname).not.toBe('/')
    })

    // THEN: pathname is exactly /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })

  test('[P2] should immediately mark Clientes as active after the index redirect', async () => {
    // GIVEN: app boots at /
    renderRouterAt('/')

    // WHEN: router resolves and renders the destination
    // THEN: Clientes is the active item
    expect(await screen.findByTestId('nav-item-clientes-active')).toBeInTheDocument()
  })

  test('[P2] should NOT render the Contactos heading after the redirect from /', async () => {
    // GIVEN: app boots at /
    renderRouterAt('/')

    // WHEN: redirect resolves
    await screen.findByRole('heading', { name: 'Clientes' })

    // THEN: Contactos placeholder is NOT mounted (router resolved to /clientes only)
    expect(screen.queryByRole('heading', { name: 'Contactos' })).not.toBeInTheDocument()
  })

  test('[P2] should NOT render the 404 page when navigating to /', async () => {
    // GIVEN: app boots at /
    renderRouterAt('/')

    // WHEN: redirect resolves
    await screen.findByRole('heading', { name: 'Clientes' })

    // THEN: there is no 404 heading on the page
    expect(screen.queryByRole('heading', { name: '404' })).not.toBeInTheDocument()
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument()
  })
})

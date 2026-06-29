/**
 * Story 1.2: Frontend Navigation Shell — EXPANDED COVERAGE
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Expansion (testarch-automate) — edges and negative paths
 * Builds on top of the ATDD baseline in `notfound.test.tsx`.
 *
 * Coverage focus (NOT duplicated with ATDD):
 *   - AC #4 edges: 404 from mobile viewport keeps NavigationBar visible (not rail),
 *     deeply nested unknown paths still resolve to NotFound, the 404 page does
 *     NOT highlight any nav item as active, and the literal copy uses the exact
 *     casing/diacritics from the spec.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

function setupViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: /min-width:\s*1024px/.test(query) ? width >= 1024 : width < 1024,
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

function renderRouterAt(initialPath: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  const result = render(<RouterProvider router={router} />)
  return { router, ...result }
}

describe('Not Found route edges (Story 1.2 / AC #4 — edges)', () => {
  beforeEach(() => {
    setupViewport(1280)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('[P2] should render the 404 view inside the mobile shell when on a mobile viewport', async () => {
    // GIVEN: mobile viewport
    setupViewport(375)

    // WHEN: navigating to an unknown route on mobile
    renderRouterAt('/no-existe-en-mobile')

    // THEN: 404 heading is rendered AND NavigationBar (mobile) is still visible
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    // AND: the desktop rail is NOT present on mobile, even on 404
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
  })

  test('[P2] should resolve to NotFound for a deeply nested unknown path', async () => {
    // GIVEN: a multi-segment path that does not match any route
    setupViewport(1280)

    // WHEN: navigating
    renderRouterAt('/a/b/c/d/e/no-existe')

    // THEN: 404 heading is rendered
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })

  test('[P2] should render Spanish copy with the literal diacritic (Página, not Pagina)', async () => {
    // GIVEN: unknown route
    setupViewport(1280)

    // WHEN: navigating
    renderRouterAt('/literal-diacritic')

    // THEN: the heading copy uses the literal accent
    const copy = await screen.findByText('Página no encontrada')
    expect(copy.textContent).toContain('Página')
    expect(copy.textContent).not.toBe('Pagina no encontrada')
  })

  test('[P2] should NOT mark Clientes or Contactos as active when on an unknown route', async () => {
    // GIVEN: unknown root-level route
    setupViewport(1280)

    // WHEN: navigating
    renderRouterAt('/random-404')

    // THEN: neither active marker is mounted
    await screen.findByRole('heading', { name: '404' })
    expect(screen.queryByTestId('nav-item-clientes-active')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-item-contactos-active')).not.toBeInTheDocument()
  })

  test('[P3] should render the 404 heading element as h1', async () => {
    // GIVEN: unknown route
    setupViewport(1280)

    // WHEN: navigating
    renderRouterAt('/heading-level')

    // THEN: heading is an <h1> (per UX spec / a11y heading order)
    const heading = await screen.findByRole('heading', { name: '404' })
    expect(heading.tagName.toLowerCase()).toBe('h1')
  })
})

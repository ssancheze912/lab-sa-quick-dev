/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase
 * Verifies TanStack Router's defaultNotFoundComponent renders the
 * Spanish 404 view INSIDE the shell layout (rail/navbar still visible).
 *
 * Acceptance Criteria covered:
 *   AC #4 — Unknown route shows graceful 404 with shell layout intact
 *
 * Test case:
 *   TC-E1-P1-04  404 / not-found view
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

describe('Not Found route (Story 1.2 / AC #4)', () => {
  beforeEach(() => {
    setupViewport(1280)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // TC-E1-P1-04 ─────────────────────────────────────────────────────────────
  test('renders the Spanish 404 heading for an unknown route', async () => {
    // GIVEN: a route that does not exist in the route tree
    // WHEN: the router resolves the location
    renderRouterAt('/ruta-que-no-existe')

    // THEN: the literal "404" heading is rendered
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  test('renders the Spanish copy "Página no encontrada"', async () => {
    // GIVEN: a route that does not exist
    // WHEN: the router resolves the location
    renderRouterAt('/foo/bar/no-existe')

    // THEN: the Spanish body copy is shown
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
  })

  test('keeps the shell layout visible (NavigationRail still mounted) on 404', async () => {
    // GIVEN: desktop viewport
    setupViewport(1280)

    // WHEN: navigating to an unknown route
    renderRouterAt('/ruta-que-no-existe')

    // THEN: the shell's NavigationRail is still present so the user can escape
    expect(await screen.findByTestId('navigation-rail')).toBeInTheDocument()
  })
})

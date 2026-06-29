/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase
 * Verifies the root index route (`/`) issues a router-level redirect
 * to `/clientes` (via `beforeLoad` + `redirect()`), NOT a `<Navigate>`-style
 * render fallback.
 *
 * Acceptance Criteria covered:
 *   AC #5 — Opening / redirects to /clientes without flicker
 *
 * Test case:
 *   TC-E1-P2-03  Index redirect to /clientes
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

function renderRouterAtRoot() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const result = render(<RouterProvider router={router} />)
  return { router, ...result }
}

describe('Index route — / redirects to /clientes (Story 1.2 / AC #5)', () => {
  beforeEach(() => {
    setupDesktopViewport()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // TC-E1-P2-03 ─────────────────────────────────────────────────────────────
  test('router location resolves to /clientes when navigating to /', async () => {
    // GIVEN: the router is started at the root path /
    const { router } = renderRouterAtRoot()

    // WHEN: TanStack Router resolves the route (beforeLoad throws redirect)
    // THEN: the final pathname is /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  test('renders the Clientes placeholder after the redirect resolves', async () => {
    // GIVEN: starting at /
    renderRouterAtRoot()

    // WHEN/THEN: the Clientes route component is rendered
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
  })
})

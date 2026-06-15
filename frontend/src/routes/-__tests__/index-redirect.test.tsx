/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Routing Test — RED Phase (Vitest + React Testing Library)
 *
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Covers Acceptance Criteria:
 *   AC #6 — Root path `/` redirects to `/clientes` (per architecture decision).
 *
 * Test Case mapped:
 *   TC-E1-P2-03 — Index route redirects to /clientes
 */

import { describe, expect, test, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { routeTree } from '@/routeTree.gen'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', {
    value: 1280,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('1024'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  window.dispatchEvent(new Event('resize'))
}

describe('Index route redirect (AC #6, TC-E1-P2-03)', () => {
  beforeEach(() => {
    setDesktopViewport()
  })

  afterEach(() => {
    cleanup()
  })

  test('GIVEN user lands on `/` WHEN the router loads THEN the URL changes to `/clientes`', async () => {
    // GIVEN: A router whose initial history is the root path
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    // WHEN: The application is rendered
    render(<RouterProvider router={router} />)

    // THEN: The router state resolves to /clientes (redirect occurred)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  test('GIVEN user lands on `/` WHEN the redirect resolves THEN the Clientes view content is rendered', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    render(<RouterProvider router={router} />)

    // THEN: The Clientes heading is present (proves the Clientes view rendered, not a blank index)
    expect(
      await screen.findByRole('heading', { name: /^clientes$/i }),
    ).toBeInTheDocument()
  })
})

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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

  function makeQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    })
  }

  test('GIVEN user lands on `/` WHEN the router loads THEN the URL changes to `/clientes`', async () => {
    // GIVEN: A router whose initial history is the root path
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    // WHEN: The application is rendered (QueryClient wrapper required because
    // the Clientes view now consumes `useClientes` from Story 2.1).
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

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

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    // THEN: the clientes list panel (Story 2.1) is present — proves the
    // Clientes view rendered after the redirect, not a blank index.
    expect(
      await screen.findByTestId('clientes-list-panel'),
    ).toBeInTheDocument()
  })
})

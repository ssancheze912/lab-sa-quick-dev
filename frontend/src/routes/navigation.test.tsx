/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase
 * Verifies SPA navigation between /clientes and /contactos triggers
 * TanStack Router client-side transitions (no full page reload).
 *
 * Acceptance Criteria covered:
 *   AC #1 — Clicking a nav entry navigates client-side (no full page reload, no window.location.href)
 *
 * Test case:
 *   TC-E1-P1-01  SPA navigation — no full page reload
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
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

function renderRouterAt(initialPath: string) {
  server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])))
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router, ...result }
}

describe('SPA navigation — Clientes <-> Contactos (Story 1.2 / AC #1)', () => {
  let reloadSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setupDesktopViewport()

    // Spy on window.location.reload — must NEVER be called by router navigation.
    reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {
      throw new Error('window.location.reload must not be called during SPA navigation')
    })
  })

  afterEach(() => {
    reloadSpy.mockRestore()
  })

  // TC-E1-P1-01 ─────────────────────────────────────────────────────────────
  test('navigates from Clientes to Contactos without a full reload', async () => {
    const user = userEvent.setup()

    // GIVEN: the app is loaded at /clientes
    const { router } = renderRouterAt('/clientes')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    // WHEN: the user clicks the "Contactos" nav entry
    const contactosLink = await screen.findByTestId('nav-link-contactos')
    await user.click(contactosLink)

    // THEN: the router location updates to /contactos
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    // AND: the Contactos placeholder is rendered
    expect(await screen.findByRole('heading', { name: 'Contactos' })).toBeInTheDocument()

    // AND: no full page reload occurred
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  test('navigates from Contactos back to Clientes without a full reload', async () => {
    const user = userEvent.setup()

    // GIVEN: the app is loaded at /contactos
    const { router } = renderRouterAt('/contactos')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    // WHEN: the user clicks the "Clientes" nav entry
    const clientesLink = await screen.findByTestId('nav-link-clientes')
    await user.click(clientesLink)

    // THEN: the router location updates to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    // AND: the Clientes view is rendered
    expect(await screen.findByTestId('client-list-panel')).toBeInTheDocument()

    // AND: no full page reload occurred
    expect(reloadSpy).not.toHaveBeenCalled()
  })
})

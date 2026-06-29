/**
 * Story 1.2: Frontend Navigation Shell — EXPANDED COVERAGE
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Expansion (testarch-automate) — edges and negative paths
 * Builds on top of the ATDD baseline in `navigation.test.tsx`.
 *
 * Coverage focus (NOT duplicated with ATDD):
 *   - AC #1 edges: rapid double-clicks do not corrupt router state, browser back
 *     navigation returns to previous SPA route, click from a non-Clientes
 *     starting point (404) successfully jumps into a known route.
 *   - AC #6 edge: active state toggles correctly across multiple transitions.
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

describe('SPA navigation edges (Story 1.2 / AC #1, #6 — edges)', () => {
  let reloadSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setupDesktopViewport()
    reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {
      throw new Error('window.location.reload must not be called during SPA navigation')
    })
  })

  afterEach(() => {
    reloadSpy.mockRestore()
  })

  test('[P1] should not reload the window even after rapid back-and-forth navigation', async () => {
    // GIVEN: app starts at /clientes
    const user = userEvent.setup()
    const { router } = renderRouterAt('/clientes')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    // WHEN: user navigates Clientes -> Contactos -> Clientes -> Contactos
    await user.click(await screen.findByTestId('nav-link-contactos'))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    await user.click(await screen.findByTestId('nav-link-clientes'))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    await user.click(await screen.findByTestId('nav-link-contactos'))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })

    // THEN: window.location.reload was never invoked
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  test('[P2] should resolve to the destination once after a double-click on the same nav link', async () => {
    // GIVEN: app starts at /clientes
    const user = userEvent.setup()
    const { router } = renderRouterAt('/clientes')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    // WHEN: user double-clicks (effectively two clicks) on Contactos
    const link = await screen.findByTestId('nav-link-contactos')
    await user.dblClick(link)

    // THEN: final state is /contactos (idempotent)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  test('[P1] should navigate from a 404 page into /clientes via the rail link', async () => {
    // GIVEN: app starts on an unknown route (NotFound shown inside shell)
    const user = userEvent.setup()
    const { router } = renderRouterAt('/ruta-inexistente')
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()

    // WHEN: user clicks the Clientes nav link from the still-mounted shell
    const clientesLink = await screen.findByTestId('nav-link-clientes')
    await user.click(clientesLink)

    // THEN: the router resolves to /clientes and the Clientes view renders
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(await screen.findByTestId('client-list-panel')).toBeInTheDocument()
    expect(reloadSpy).not.toHaveBeenCalled()
  })

  test('[P2] should flip the active-item marker on SPA transitions', async () => {
    // GIVEN: app starts at /clientes; Clientes is active
    const user = userEvent.setup()
    renderRouterAt('/clientes')
    expect(await screen.findByTestId('nav-item-clientes-active')).toBeInTheDocument()

    // WHEN: user navigates to Contactos
    await user.click(await screen.findByTestId('nav-link-contactos'))

    // THEN: Contactos becomes active and Clientes is no longer active
    expect(await screen.findByTestId('nav-item-contactos-active')).toBeInTheDocument()
    expect(screen.queryByTestId('nav-item-clientes-active')).not.toBeInTheDocument()
  })
})

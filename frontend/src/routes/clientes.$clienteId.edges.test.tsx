/**
 * Story 2.2 — Route /clientes/$clienteId edge-case automation expansion.
 *
 * Complements clientes.$clienteId.test.tsx with cases the ATDD layer omits:
 *   [P2] Browser-back from /clientes/{id} returns the router to /clientes
 *   [P2] Navigating between two ids preserves the list-panel DOM identity
 *        (deep-link-A → deep-link-B without intermediate /clientes stop)
 *   [P2] Clicking ANOTHER item after a deep link updates the selection +
 *        URL without remounting the list
 *   [P2] When the list endpoint errors but the detail endpoint succeeds,
 *        the detail still renders (list & detail are independent queries)
 *   [P2] Cold deep-link to a non-existent id does NOT call the LIST endpoint
 *        more than once (cache reuse, AC #10 contract extension)
 */
import { describe, expect, test } from 'vitest'
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
import {
  buildClienteFixture,
  clienteByIdHandler,
  clienteByIdNotFoundHandler,
} from '@/mocks/handlers/clientes'
import { routeTree } from '../routeTree.gen'

function renderRouterAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return { router, ...utils }
}

describe('Route /clientes/$clienteId — edge cases', () => {
  // ─── [P2] Browser-back from /clientes/{id} → /clientes ───────────────
  test('[P2] router.history.back() from /clientes/{id} returns to /clientes', async () => {
    const cliente = buildClienteFixture({ nombre: 'Back History Client' })
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
      ...clienteByIdHandler(cliente)
    )

    // Build history with /clientes then /clientes/{id}
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
    })
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: ['/clientes', `/clientes/${cliente.id}`],
        initialIndex: 1,
      }),
    })
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )

    expect(await screen.findByTestId('cliente-detail-card')).toBeInTheDocument()

    // Simulate browser back
    router.history.back()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(screen.getByTestId('client-list-panel')).toBeInTheDocument()
  })

  // ─── [P2] Switching ids preserves the list-panel DOM identity ─────────
  test('[P2] clicking a second list item swaps the detail without remounting the list', async () => {
    const a = buildClienteFixture({ nombre: 'Cliente A' })
    const b = buildClienteFixture({ nombre: 'Cliente B' })
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([a, b])),
      ...clienteByIdHandler(a),
      ...clienteByIdHandler(b)
    )
    const user = userEvent.setup()

    const { router } = renderRouterAt('/clientes')

    const panelBefore = await screen.findByTestId('client-list-panel')
    const itemA = await screen.findByTestId(`client-list-item-${a.id}`)
    await user.click(itemA)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clientes/${a.id}`)
    })
    // Wait for the detail card to be rendered for A
    expect(await screen.findByTestId('cliente-detail-card')).toBeInTheDocument()

    const itemB = await screen.findByTestId(`client-list-item-${b.id}`)
    await user.click(itemB)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clientes/${b.id}`)
    })

    // The list panel DOM node MUST be the same reference
    const panelAfter = screen.getByTestId('client-list-panel')
    expect(panelAfter).toBe(panelBefore)
  })

  // ─── [P2] List endpoint is NOT re-fetched during selection changes ────
  test('[P2] selecting a list item does NOT re-trigger GET /api/v1/clientes', async () => {
    const cliente = buildClienteFixture({ nombre: 'Cliente One' })
    let listCalls = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        listCalls += 1
        return HttpResponse.json([cliente])
      }),
      ...clienteByIdHandler(cliente)
    )
    const user = userEvent.setup()

    renderRouterAt('/clientes')
    await screen.findByTestId(`client-list-item-${cliente.id}`)
    const callsAfterListLoad = listCalls

    // WHEN: select the cliente
    await user.click(screen.getByTestId(`client-list-item-${cliente.id}`))
    await screen.findByTestId('cliente-detail-card')

    // THEN: list endpoint NOT called again
    expect(listCalls).toBe(callsAfterListLoad)
  })

  // ─── [P2] Detail renders even if the list endpoint errors ────────────
  test('[P2] detail card renders even when the list endpoint errors (independent queries)', async () => {
    const cliente = buildClienteFixture({ nombre: 'Detail Only Client' })
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ type: 'about:blank', title: 'Server Error', status: 500 }, { status: 500 })
      ),
      ...clienteByIdHandler(cliente)
    )

    renderRouterAt(`/clientes/${cliente.id}`)

    expect(await screen.findByTestId('cliente-detail-card')).toBeInTheDocument()
    // Nombre appears in BOTH the <h2> heading AND the DescriptionList row (AC #9).
    expect(screen.getAllByText('Detail Only Client').length).toBeGreaterThanOrEqual(1)
  })

  // ─── [P2] Cold deep-link to not-found id renders not-found + list ────
  test('[P2] cold deep-link to non-existent id: list endpoint called exactly once', async () => {
    const id = '00000000-0000-0000-0000-000000000000'
    let listCalls = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        listCalls += 1
        return HttpResponse.json([])
      }),
      ...clienteByIdNotFoundHandler(id)
    )

    renderRouterAt(`/clientes/${id}`)

    expect(await screen.findByTestId('cliente-not-found')).toBeInTheDocument()
    // The list endpoint is called once for the panel — never re-called by
    // the not-found path.
    expect(listCalls).toBe(1)
  })

  // ─── [P2] /clientes (no segment) does NOT call the detail endpoint ────
  test('[P2] /clientes (no segment) does NOT fire any GET /api/v1/clientes/:id', async () => {
    const cliente = buildClienteFixture()
    let perIdCalls = 0
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
      http.get('*/api/v1/clientes/:id', () => {
        perIdCalls += 1
        return HttpResponse.json(cliente)
      })
    )

    renderRouterAt('/clientes')
    await screen.findByTestId(`client-list-item-${cliente.id}`)

    // No selection → no detail fetch
    expect(perIdCalls).toBe(0)
  })
})

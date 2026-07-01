/**
 * Route integration test for /clientes — Story 2.1 AC #1 (split panel exists)
 * and AC #10 (persistent shell remains mounted across state transitions).
 *
 * Test IDs: 2.1-ROUTE-001..004. Priority: P0 (shell stability under state churn).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'

import { routeTree } from '@/routeTree.gen'
import {
  clientesSuccessHandler,
  clientesEmptyHandler,
  clientesErrorHandler,
  seedClientes,
} from '@/modules/crm/clientes/__mocks__/msw-handlers'

const server = setupServer(clientesSuccessHandler(seedClientes))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers(clientesSuccessHandler(seedClientes)))
afterAll(() => server.close())

function renderAtClientes() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/clientes'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      {/* @ts-expect-error router type mismatch is expected in the test harness */}
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('/clientes route — Story 2.1 AC #1 + AC #10', () => {
  it('[P0][2.1-ROUTE-001] given the user navigates to /clientes, when the page loads, then both the list panel and the right-side placeholder are rendered', async () => {
    // GIVEN + WHEN
    renderAtClientes()
    // THEN
    expect(await screen.findByTestId('cliente-list-panel')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument()
    expect(
      screen.getByText(/selecciona un cliente para ver su detalle/i),
    ).toBeInTheDocument()
  })

  it('[P0][2.1-ROUTE-002] given the shell is mounted, when the list transitions from success → search-empty, then <main data-testid="app-content"> keeps the same DOM reference (AC #10)', async () => {
    // GIVEN
    renderAtClientes()
    const initialMain = await screen.findByTestId('app-content')
    const initialMainRef = initialMain
    await screen.findByTestId('cliente-list-panel')

    // WHEN — type a query that matches nothing
    fireEvent.change(screen.getByTestId('cliente-search-input'), {
      target: { value: 'zzz-nothing' },
    })
    await screen.findByTestId('cliente-search-empty')

    // THEN — the <main> node is exactly the same DOM element (not re-mounted)
    expect(screen.getByTestId('app-content')).toBe(initialMainRef)
  })

  it('[P1][2.1-ROUTE-003] given the API returns [], when the empty state renders, then the persistent shell stays mounted', async () => {
    // GIVEN
    server.use(clientesEmptyHandler())
    // WHEN
    renderAtClientes()
    const empty = await screen.findByTestId('cliente-list-empty')
    // THEN — shell present alongside the empty state
    expect(empty).toBeInTheDocument()
    expect(screen.getByTestId('app-content')).toBeInTheDocument()
    expect(screen.getByTestId('nav-rail-desktop')).toBeInTheDocument()
  })

  it('[P1][2.1-ROUTE-004] given the API returns 500, when the error panel renders, then the persistent shell stays mounted', async () => {
    // GIVEN
    server.use(clientesErrorHandler())
    // WHEN
    renderAtClientes()
    const errorPanel = await screen.findByTestId('cliente-list-error')
    // THEN
    expect(errorPanel).toBeInTheDocument()
    expect(screen.getByTestId('app-content')).toBeInTheDocument()
    expect(screen.getByTestId('nav-rail-desktop')).toBeInTheDocument()
    // sanity: no crash placeholder
    await waitFor(() => {
      expect(screen.queryByText(/página no encontrada/i)).not.toBeInTheDocument()
    })
  })
})

/**
 * Story 2.6: Sort Client List — Automation Expansion (testarch-automate)
 * Epic 2: Client Management
 *
 * Edge cases NOT covered by the ATDD RED-phase suite (`ClienteListView.sort.test.tsx`), which
 * exercises the 4 sort modes, filter-preservation, and default-order scenarios against
 * "happy path" 3-item fixtures. Kept in a dedicated sibling file per `test-quality.md`'s
 * file-length guidance and matching the project's established `.edge-cases.test.tsx` split
 * convention (see `ClienteListView.edge-cases.test.tsx`, Story 2.1).
 *
 * Covers:
 *  - `SortControl` remains visible/rendered in every list state (empty, error, single-item,
 *    zero-search-results) — an explicit claim in Story 2.6's Dev Notes ("the control is
 *    visible for every list state (loaded/empty/error)") that no ATDD test verifies directly.
 *  - Sorting a single-item list (trivial reorder, no crash).
 *  - Sorting a list where every client shares the same nombre (tie stability, no crash).
 *  - Changing sort while an active search yields zero results (no crash, no items).
 *  - Round-tripping through all 4 sort options back to the default returns the same order.
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteListView } from './ClienteListView'

const CLIENTES_ENDPOINT = '*/api/v1/clientes'

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const rootRoute = createRootRoute({
    component: () => <ClienteListView />,
  })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => <div>Detail</div>,
  })
  const routeTree = rootRoute.addChildren([detailRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

/** Opens the SortControl's Select menu and clicks the option with the given visible label. */
async function seleccionarOrden(opcion: string) {
  const sortControl = screen.getByTestId('sort-control')
  fireEvent.click(within(sortControl).getByRole('button'))
  const option = await within(sortControl).findByRole('option', { name: opcion })
  fireEvent.click(option)
}

function listedNombres(panel: HTMLElement): string[] {
  return within(panel)
    .getAllByTestId('cliente-list-item')
    .map((item) => item.textContent ?? '')
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('SortControl visibility across list states', () => {
  test('[P2] renders SortControl even when the client list is empty (AC3-style EmptyState)', async () => {
    // GIVEN: the backend returns zero clients
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([])))

    // WHEN: ClienteListView mounts
    renderClienteListView()

    // THEN: the EmptyState renders AND SortControl is still visible (per Dev Notes)
    await screen.findByTestId('empty-state')
    expect(screen.getByTestId('sort-control')).toBeInTheDocument()
  })

  test('[P2] renders SortControl even when the client list fails to load (ErrorPanel state)', async () => {
    // GIVEN: the backend request fails
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json(null, { status: 500 })))

    // WHEN: ClienteListView mounts
    renderClienteListView()

    // THEN: the ErrorPanel renders AND SortControl remains visible
    await screen.findByTestId('error-panel')
    expect(screen.getByTestId('sort-control')).toBeInTheDocument()
  })

  test('[P2] SortControl remains usable when an active search filters the list down to zero results', async () => {
    // GIVEN: the client list has loaded with clients that will not match the upcoming search
    const cliente = createCliente({ nombre: 'Único Cliente' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([cliente])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1))

    // WHEN: the user searches for a term matching nothing, then changes the sort order
    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'zzz-no-match-zzz' } })
    await waitFor(() => expect(within(panel).queryAllByTestId('cliente-list-item')).toHaveLength(0))

    // THEN: SortControl is still present and interactable, no crash, still zero items
    expect(screen.getByTestId('sort-control')).toBeInTheDocument()
    await seleccionarOrden('Nombre A→Z')
    expect(within(panel).queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

describe('Sorting boundary datasets', () => {
  test('[P2] sorting a single-item list is a no-op that does not crash', async () => {
    // GIVEN: exactly one client
    const solo = createCliente({ nombre: 'Único Cliente' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([solo])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(1))

    // WHEN: the user cycles through every sort option
    await seleccionarOrden('Nombre A→Z')
    await seleccionarOrden('Nombre Z→A')
    await seleccionarOrden('Más antiguo')
    await seleccionarOrden('Más reciente')

    // THEN: the single item remains the only rendered item throughout
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres).toHaveLength(1)
      expect(nombres[0]).toContain('Único Cliente')
    })
  })

  test('[P2] sorting clients that all share the same nombre does not crash and keeps all items visible', async () => {
    // GIVEN: three clients with identical nombre but distinct createdAt values
    const first = createCliente({ nombre: 'Cliente Genérico', createdAt: '2024-01-01T00:00:00.000Z' })
    const second = createCliente({ nombre: 'Cliente Genérico', createdAt: '2024-02-01T00:00:00.000Z' })
    const third = createCliente({ nombre: 'Cliente Genérico', createdAt: '2024-03-01T00:00:00.000Z' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([first, second, third])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: the user sorts by name (a no-op ordering-wise, since all names are equal)
    await seleccionarOrden('Nombre A→Z')

    // THEN: all three items remain rendered, none dropped or duplicated
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))
  })

  test('[P3] cycling through all 4 sort options and back to the default reproduces the original default order', async () => {
    // GIVEN: 3 clients with distinct, clearly-ordered createdAt timestamps
    const oldest = createCliente({ nombre: 'Oldest', createdAt: '2024-01-01T00:00:00.000Z' })
    const middle = createCliente({ nombre: 'Middle', createdAt: '2024-06-01T00:00:00.000Z' })
    const newest = createCliente({ nombre: 'Newest', createdAt: '2024-12-01T00:00:00.000Z' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([middle, oldest, newest])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))
    const defaultOrder = listedNombres(panel)

    // WHEN: the user cycles through every non-default option and returns to "Más reciente"
    await seleccionarOrden('Nombre A→Z')
    await seleccionarOrden('Nombre Z→A')
    await seleccionarOrden('Más antiguo')
    await seleccionarOrden('Más reciente')

    // THEN: the order matches the original default (fecha-desc) order exactly
    await waitFor(() => {
      expect(listedNombres(panel)).toEqual(defaultOrder)
    })
  })
})

/**
 * Story 2.6: Sort Client List
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until `SortControl` (and `SortOption`,
 * `SORT_OPTIONS`, `sortClientes`) exist at `frontend/src/shared/components/SortControl.tsx`
 * and `ClienteListView` wires `sortOption` state + renders `<SortControl>` (Story 2.6 Tasks
 * 1-2). Today this file fails to compile/render because none of that exists yet — this is
 * the expected RED state (missing implementation, not a test bug), consistent with the
 * project's established ATDD convention (see `ClienteListView.test.tsx`,
 * `_bmad-output/atdd-checklist-2-5-delete-client.md`).
 *
 * Sort tests live in this dedicated sibling file — not appended to `ClienteListView.test.tsx`
 * (already 372 lines) — per the project's <300-line-per-file convention (Story 2.5 Dev
 * Notes), matching the existing `.edge-cases.test.tsx` / `.perf.test.tsx` split pattern.
 *
 * Acceptance Criteria covered:
 *   AC1 — "Nombre A→Z" reorders ascending by nombre, zero additional network requests
 *   AC2 — "Nombre Z→A" reorders descending by nombre, zero additional network requests
 *   AC3 — "Más reciente" orders by createdAt descending
 *   AC4 — "Más antiguo" orders by createdAt ascending
 *   AC5 — sort applied to the already-filtered (searched) result set; search value untouched;
 *         zero additional network requests
 *   AC6 — default sortOption is 'fecha-desc' on first render (no prior interaction)
 *
 * Test-design traceability (`test-design-epic-2.md`):
 *   TC-E2-P1-11 (R5) — sort by name, no new fetch
 *   TC-E2-P1-12 (R5) — sort + active search combined, filter preserved
 *   TC-E2-P2-01       — sort by date
 *   TC-E2-P2-02 (R11) — default sort order on first render
 *
 * Required data-testid attributes (documented for DEV team, see ATDD checklist):
 *   - `sort-control` — wrapping div around siesa-ui-kit's `Select` (mandated by
 *     `test-design-epic-2.md` line 702; `Select` itself exposes no testid/className-on-root
 *     prop for its trigger)
 *
 * Network-first pattern (network-first.md): every test registers its MSW handler via
 * `server.use(...)` BEFORE rendering `ClienteListView`, and counts handler invocations to
 * assert "no new API call" per AC #1/#2/#5.
 *
 * SortControl interaction pattern: siesa-ui-kit's `Select` wraps Headless UI's `Listbox`
 * (verified against the installed `node_modules/siesa-ui-kit` bundle) — the trigger is a
 * native `<button>` and each option renders with `role="option"` inside the same DOM subtree
 * (not portalled), so `within(sortControl)` can locate both the trigger and its options.
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

/** Returns the visible `nombre` text of every rendered cliente-list-item, in DOM order. */
function listedNombres(panel: HTMLElement): string[] {
  return within(panel)
    .getAllByTestId('cliente-list-item')
    .map((item) => item.textContent ?? '')
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AC1/AC2 — TC-E2-P1-11: sort by Nombre A→Z / Z→A without a new API call (R5)', () => {
  test('[P1] "Nombre A→Z" reorders the list alphabetically ascending by nombre', async () => {
    // GIVEN: the client list has loaded with 3 clients in non-alphabetical order
    const beta = createCliente({ nombre: 'Beta' })
    const alfa = createCliente({ nombre: 'Alfa' })
    const charlie = createCliente({ nombre: 'Charlie' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([beta, alfa, charlie])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: the user selects "Nombre A→Z" from SortControl
    await seleccionarOrden('Nombre A→Z')

    // THEN: the list reorders alphabetically ascending
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres[0]).toContain('Alfa')
      expect(nombres[1]).toContain('Beta')
      expect(nombres[2]).toContain('Charlie')
    })
  })

  test('[P1] "Nombre Z→A" reorders the list alphabetically descending by nombre', async () => {
    // GIVEN: the client list has loaded with 3 clients in non-alphabetical order
    const beta = createCliente({ nombre: 'Beta' })
    const alfa = createCliente({ nombre: 'Alfa' })
    const charlie = createCliente({ nombre: 'Charlie' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([beta, alfa, charlie])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: the user selects "Nombre Z→A" from SortControl
    await seleccionarOrden('Nombre Z→A')

    // THEN: the list reorders alphabetically descending
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres[0]).toContain('Charlie')
      expect(nombres[1]).toContain('Beta')
      expect(nombres[2]).toContain('Alfa')
    })
  })

  test('[P1] switching between "Nombre A→Z" and "Nombre Z→A" fires zero additional GET /api/v1/clientes requests', async () => {
    // GIVEN: the client list has loaded and network calls are being counted
    let requestCount = 0
    const beta = createCliente({ nombre: 'Beta' })
    const alfa = createCliente({ nombre: 'Alfa' })
    const charlie = createCliente({ nombre: 'Charlie' })
    server.use(
      http.get(CLIENTES_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json([beta, alfa, charlie])
      }),
    )
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))
    expect(requestCount).toBe(1)

    // WHEN: the user changes the sort order twice (A→Z, then Z→A)
    await seleccionarOrden('Nombre A→Z')
    await waitFor(() => expect(listedNombres(panel)[0]).toContain('Alfa'))
    await seleccionarOrden('Nombre Z→A')
    await waitFor(() => expect(listedNombres(panel)[0]).toContain('Charlie'))

    // THEN: no additional network request was triggered — the initial mount fetch is the only one
    expect(requestCount).toBe(1)
  })
})

describe('AC5 — TC-E2-P1-12: sort applied to active search results without clearing the filter (R5)', () => {
  test('[P1] changing sort order preserves the active search filter and its input value', async () => {
    // GIVEN: only a subset of clients matches an active search term
    const matchBeta = createCliente({ nombre: 'Nombre Test Beta' })
    const matchAlfa = createCliente({ nombre: 'Nombre Test Alfa' })
    const noMatch = createCliente({ nombre: 'Otro Cliente' })
    server.use(
      http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([matchBeta, matchAlfa, noMatch])),
    )
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'Nombre Test' } })
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))

    // WHEN: the user changes the sort order while the search filter is active
    await seleccionarOrden('Nombre A→Z')

    // THEN: only the filtered subset is shown, in the new order, and the search value is unchanged
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres).toHaveLength(2)
      expect(nombres[0]).toContain('Nombre Test Alfa')
      expect(nombres[1]).toContain('Nombre Test Beta')
    })
    expect((searchInput as HTMLInputElement).value).toBe('Nombre Test')
  })

  test('[P1] changing sort order while search is active fires zero additional GET /api/v1/clientes requests', async () => {
    // GIVEN: an active search filter narrowing the visible clients, network calls counted
    let requestCount = 0
    const matchBeta = createCliente({ nombre: 'Nombre Test Beta' })
    const matchAlfa = createCliente({ nombre: 'Nombre Test Alfa' })
    const noMatch = createCliente({ nombre: 'Otro Cliente' })
    server.use(
      http.get(CLIENTES_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json([matchBeta, matchAlfa, noMatch])
      }),
    )
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    const searchInput = screen.getByRole('textbox', { name: /buscar clientes/i })
    fireEvent.change(searchInput, { target: { value: 'Nombre Test' } })
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(2))
    expect(requestCount).toBe(1)

    // WHEN: the user changes the sort order
    await seleccionarOrden('Nombre Z→A')
    await waitFor(() => expect(listedNombres(panel)[0]).toContain('Nombre Test Beta'))

    // THEN: no additional network request was triggered
    expect(requestCount).toBe(1)
  })
})

describe('AC3/AC4 — TC-E2-P2-01: sort by Más reciente / Más antiguo (createdAt)', () => {
  test('[P2] "Más reciente" orders the list by createdAt descending (newest first)', async () => {
    // GIVEN: 3 clients with distinct, clearly-ordered createdAt timestamps
    const oldest = createCliente({ nombre: 'Oldest', createdAt: '2024-01-01T00:00:00.000Z' })
    const middle = createCliente({ nombre: 'Middle', createdAt: '2024-06-01T00:00:00.000Z' })
    const newest = createCliente({ nombre: 'Newest', createdAt: '2024-12-01T00:00:00.000Z' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([middle, oldest, newest])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: the user selects "Más reciente"
    await seleccionarOrden('Más reciente')

    // THEN: the most recently created client appears first
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres[0]).toContain('Newest')
      expect(nombres[1]).toContain('Middle')
      expect(nombres[2]).toContain('Oldest')
    })
  })

  test('[P2] "Más antiguo" orders the list by createdAt ascending (oldest first)', async () => {
    // GIVEN: 3 clients with distinct, clearly-ordered createdAt timestamps
    const oldest = createCliente({ nombre: 'Oldest', createdAt: '2024-01-01T00:00:00.000Z' })
    const middle = createCliente({ nombre: 'Middle', createdAt: '2024-06-01T00:00:00.000Z' })
    const newest = createCliente({ nombre: 'Newest', createdAt: '2024-12-01T00:00:00.000Z' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([middle, oldest, newest])))
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')
    await waitFor(() => expect(within(panel).getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: the user selects "Más antiguo"
    await seleccionarOrden('Más antiguo')

    // THEN: the oldest created client appears first
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres[0]).toContain('Oldest')
      expect(nombres[1]).toContain('Middle')
      expect(nombres[2]).toContain('Newest')
    })
  })
})

describe('AC6 — TC-E2-P2-02: default sort on initial load is "Más reciente" (R11)', () => {
  test('[P2] renders with createdAt-desc order on first render, with no prior sort interaction', async () => {
    // GIVEN: 3 clients with distinct, clearly-ordered createdAt timestamps, returned out of order
    const oldest = createCliente({ nombre: 'Oldest', createdAt: '2024-01-01T00:00:00.000Z' })
    const middle = createCliente({ nombre: 'Middle', createdAt: '2024-06-01T00:00:00.000Z' })
    const newest = createCliente({ nombre: 'Newest', createdAt: '2024-12-01T00:00:00.000Z' })
    server.use(http.get(CLIENTES_ENDPOINT, () => HttpResponse.json([oldest, newest, middle])))

    // WHEN: ClienteListView mounts fresh, with no sort interaction at all
    renderClienteListView()
    const panel = await screen.findByTestId('clientes-list-panel')

    // THEN: the initial order already matches createdAt desc (sortOption defaults to 'fecha-desc')
    await waitFor(() => {
      const nombres = listedNombres(panel)
      expect(nombres).toHaveLength(3)
      expect(nombres[0]).toContain('Newest')
      expect(nombres[1]).toContain('Middle')
      expect(nombres[2]).toContain('Oldest')
    })
  })
})

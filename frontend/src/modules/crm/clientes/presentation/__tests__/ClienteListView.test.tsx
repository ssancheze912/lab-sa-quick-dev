/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * ATDD Component Tests — RED Phase (Vitest + React Testing Library + MSW)
 *
 * Covers Acceptance Criterion #11 (six named sub-cases from Story 2.1)
 * plus Story 2.2 additions:
 *   - ClienteListView_navigates_on_click → asserts router.navigate is called.
 *   - ClienteListView_marks_active_item_when_route_matches → asserts
 *     `data-active="true"` on the item whose id matches `selectedClienteId`.
 */

import { describe, expect, test, beforeAll, afterEach, afterAll } from 'vitest'
import type { ReactElement } from 'react'
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
  fireEvent,
} from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Acme Industrial S.A.S.',
    nit: '900111222-1',
    telefono: '3001112233',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Comercializadora Andina Ltda.',
    nit: '901222333-2',
    telefono: '3002223344',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nombre: 'Distribuciones del Pacífico',
    nit: '902333444-3',
    telefono: '3003334455',
    ciudad: 'Cali',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(SAMPLE)),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — Story 2.2 added `useRouter()` to ClienteListView, so every test
// must mount it inside a RouterProvider.
// ─────────────────────────────────────────────────────────────────────────────

interface RenderOptions {
  initialPath?: string
  selectedClienteId?: string
}

function renderWithClient(ui: ReactElement, options: RenderOptions = {}) {
  const initialPath = options.initialPath ?? '/clientes'

  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const clientesIndex = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => ui,
  })

  const clientesDetail = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => ui,
  })

  const routeTree = rootRoute.addChildren([clientesIndex, clientesDetail])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  const utils = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { ...utils, router }
}

function buildBulk(count: number) {
  const arr = []
  const base = Date.parse('2026-01-01T00:00:00.000Z')
  for (let i = 0; i < count; i++) {
    const ts = new Date(base - i * 1000).toISOString()
    arr.push({
      id: `00000000-0000-0000-0000-${i.toString().padStart(12, '0')}`,
      nombre: `Cliente Bulk ${i}`,
      nit: `9${i.toString().padStart(8, '0')}`,
      telefono: '3001112233',
      ciudad: 'Bogotá',
      createdAt: ts,
      updatedAt: ts,
    })
  }
  return arr
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Story 2.1', () => {
  test('GIVEN three clientes WHEN ClienteListView mounts THEN aside `clientes-list-panel` is 280px wide and shows 3 items', async () => {
    renderWithClient(<ClienteListView />)

    const panel = await screen.findByTestId('clientes-list-panel')
    expect(panel).toBeInTheDocument()
    expect(panel.tagName.toLowerCase()).toBe('aside')
    expect(panel.className).toMatch(/w-\[280px\]/)

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)
  })

  test('GIVEN three clientes WHEN user types "Acme" in the search input THEN only the matching item is rendered (no extra HTTP request)', async () => {
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'Acme' } })

    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
    })

    expect(screen.getByText(/acme industrial/i)).toBeInTheDocument()
    expect(screen.queryByText(/comercializadora andina/i)).not.toBeInTheDocument()
  })

  test('GIVEN three clientes WHEN user types a NIT substring "901222" THEN only the matching item is rendered', async () => {
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: '901222' } })

    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
    })

    const remainingItem = screen.getByTestId('cliente-list-item')
    expect(within(remainingItem).getByText(/comercializadora andina/i)).toBeInTheDocument()
  })

  test('GIVEN backend returns an empty array WHEN ClienteListView mounts THEN `clientes-empty-state` is visible and no items are rendered', async () => {
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])))

    renderWithClient(<ClienteListView />)

    const empty = await screen.findByTestId('clientes-empty-state')
    expect(empty).toBeInTheDocument()
    expect(empty).toHaveTextContent(/aún no hay clientes/i)
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument()
  })

  test('GIVEN GET /clientes returns 500 first WHEN user clicks Reintentar AND second call returns 200 THEN list renders', async () => {
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount += 1
        if (callCount === 1) {
          return new HttpResponse(JSON.stringify({ status: 500, title: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/problem+json' },
          })
        }
        return HttpResponse.json(SAMPLE)
      }),
    )

    renderWithClient(<ClienteListView />)

    const errorPanel = await screen.findByTestId('clientes-error-panel')
    expect(errorPanel).toBeInTheDocument()
    expect(errorPanel).toHaveTextContent(/no se pudieron cargar los clientes/i)

    const reintentar = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(reintentar)

    await waitFor(() => {
      expect(screen.queryByTestId('clientes-error-panel')).not.toBeInTheDocument()
    })

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)
    expect(callCount).toBeGreaterThanOrEqual(2)
  })

  test('GIVEN 500 clientes WHEN user types a search query THEN filter resolves under 1000ms (NFR1)', async () => {
    const bulk = buildBulk(500)
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(bulk)))

    renderWithClient(<ClienteListView />)
    const allItems = await screen.findAllByTestId('cliente-list-item')
    expect(allItems.length).toBe(500)

    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    const start = performance.now()
    fireEvent.change(search, { target: { value: 'Cliente Bulk 123' } })

    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items.length).toBeGreaterThan(0)
      expect(items.length).toBeLessThan(500)
    })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 2.2 — navigation on click + active item indicator
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Story 2.2', () => {
  test('GIVEN three clientes WHEN user clicks a ClientListItem THEN router navigates to /clientes/$clienteId', async () => {
    const { router } = renderWithClient(<ClienteListView />)

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)

    fireEvent.click(items[1])

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        `/clientes/${SAMPLE[1].id}`,
      )
    })
  })

  test('GIVEN selectedClienteId matches the second cliente WHEN the list renders THEN that item has data-active="true"', async () => {
    renderWithClient(
      <ClienteListView selectedClienteId={SAMPLE[1].id} />,
      { initialPath: `/clientes/${SAMPLE[1].id}` },
    )

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)

    expect(items[0]).toHaveAttribute('data-active', 'false')
    expect(items[1]).toHaveAttribute('data-active', 'true')
    expect(items[2]).toHaveAttribute('data-active', 'false')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 2.3 — "Nuevo cliente" button opens the form dialog
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Story 2.3', () => {
  test('ClienteListView_renders_nuevo_cliente_button — button visible above search input', async () => {
    renderWithClient(<ClienteListView />)

    const panel = await screen.findByTestId('clientes-list-panel')
    const button = await screen.findByTestId('btn-nuevo-cliente')

    expect(button).toBeInTheDocument()
    expect(panel).toContainElement(button)
    expect(button).toHaveTextContent(/nuevo cliente/i)
    expect(button.className).toMatch(/bg-\[#0e79fd\]/)
    expect(button.className).toMatch(/font-semibold/)
    expect(button.className).toMatch(/text-white/)

    // Button is ABOVE the search input in the DOM order.
    const search = screen.getByTestId('clientes-search-input')
    expect(
      button.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  test('clicking "Nuevo cliente" opens the cliente-form-dialog', async () => {
    renderWithClient(<ClienteListView />)

    const button = await screen.findByTestId('btn-nuevo-cliente')
    expect(screen.queryByTestId('cliente-form-dialog')).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(await screen.findByTestId('cliente-form-dialog')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 2.6 — Sort Client List (component-local sort, no network calls)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Story 2.6 (sort)', () => {
  // SAMPLE fixture already orders id=1 (Jan 1), id=2 (Jan 2), id=3 (Jan 3) by
  // createdAt. Default sort `fecha-desc` should render id=3, id=2, id=1.

  test('ClienteListView_renders_sort_control_when_clientes_loaded', async () => {
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    expect(screen.getByTestId('clientes-sort-control')).toBeInTheDocument()
  })

  test('ClienteListView_hides_sort_control_when_loading', async () => {
    // Hold the response open so the component stays in `isLoading: true`.
    let resolveResponse: (value: typeof SAMPLE) => void = () => {}
    const pending = new Promise<typeof SAMPLE>((res) => {
      resolveResponse = res
    })
    server.use(
      http.get('*/api/v1/clientes', async () => {
        const data = await pending
        return HttpResponse.json(data)
      }),
    )

    renderWithClient(<ClienteListView />)

    // While still loading, the sort control must NOT appear.
    expect(screen.queryByTestId('clientes-sort-control')).not.toBeInTheDocument()

    resolveResponse(SAMPLE)
    await screen.findAllByTestId('cliente-list-item')
  })

  test('ClienteListView_hides_sort_control_when_error', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    renderWithClient(<ClienteListView />)
    await screen.findByTestId('clientes-error-panel')

    expect(screen.queryByTestId('clientes-sort-control')).not.toBeInTheDocument()
  })

  test('ClienteListView_hides_sort_control_when_empty', async () => {
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])))

    renderWithClient(<ClienteListView />)
    await screen.findByTestId('clientes-empty-state')

    expect(screen.queryByTestId('clientes-sort-control')).not.toBeInTheDocument()
  })

  test('ClienteListView_shows_sort_control_when_search_returns_zero', async () => {
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'zzz-no-match' } })

    await screen.findByTestId('clientes-search-empty')

    expect(screen.getByTestId('clientes-sort-control')).toBeInTheDocument()
  })

  test('ClienteListView_default_sort_is_fecha_desc_on_first_render', async () => {
    renderWithClient(<ClienteListView />)

    const items = await screen.findAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)

    // SAMPLE: id=1 (Jan 1), id=2 (Jan 2), id=3 (Jan 3).
    // fecha-desc: newest first → id=3, id=2, id=1.
    expect(within(items[0]).getByText(/distribuciones del pacífico/i)).toBeInTheDocument()
    expect(within(items[1]).getByText(/comercializadora andina/i)).toBeInTheDocument()
    expect(within(items[2]).getByText(/acme industrial/i)).toBeInTheDocument()

    const sortControl = screen.getByTestId('clientes-sort-control') as HTMLSelectElement
    expect(sortControl.value).toBe('fecha-desc')
  })

  test('ClienteListView_changing_sort_reorders_list_without_request', async () => {
    let requestCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        requestCount += 1
        return HttpResponse.json(SAMPLE)
      }),
    )

    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    const initialCount = requestCount
    expect(initialCount).toBeGreaterThan(0)

    const sortControl = screen.getByTestId('clientes-sort-control') as HTMLSelectElement
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } })

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      // Alphabetical ASC: Acme Industrial, Comercializadora Andina, Distribuciones del Pacífico.
      expect(within(items[0]).getByText(/acme industrial/i)).toBeInTheDocument()
      expect(within(items[1]).getByText(/comercializadora andina/i)).toBeInTheDocument()
      expect(within(items[2]).getByText(/distribuciones del pacífico/i)).toBeInTheDocument()
    })

    // No additional request fired since the initial mount fetch.
    expect(requestCount).toBe(initialCount)
  })

  test('ClienteListView_sort_preserves_active_search_filter', async () => {
    // Seed 3 clientes whose nombres all start with "Acm" so the search "Acm"
    // returns multiple items we can re-order.
    const acmeSet = [
      { ...SAMPLE[0], id: 'aaa', nombre: 'Acme Norte', createdAt: '2026-01-01T00:00:00.000Z' },
      { ...SAMPLE[1], id: 'bbb', nombre: 'Acme Sur', createdAt: '2026-01-02T00:00:00.000Z' },
      { ...SAMPLE[2], id: 'ccc', nombre: 'Berkeley', createdAt: '2026-01-03T00:00:00.000Z' },
    ]
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(acmeSet)))

    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'Acm' } })

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
    })

    const sortControl = screen.getByTestId('clientes-sort-control') as HTMLSelectElement
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } })

    // (a) search input preserved exactly.
    expect(search.value).toBe('Acm')

    // (b) rendered items are the same N (=2), reordered descending.
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
      expect(within(items[0]).getByText(/acme sur/i)).toBeInTheDocument()
      expect(within(items[1]).getByText(/acme norte/i)).toBeInTheDocument()
    })

    // Berkeley is filtered out.
    expect(screen.queryByText(/berkeley/i)).not.toBeInTheDocument()
  })

  test('ClienteListView_search_after_sort_preserves_sort_option', async () => {
    renderWithClient(<ClienteListView />)
    await screen.findAllByTestId('cliente-list-item')

    const sortControl = screen.getByTestId('clientes-sort-control') as HTMLSelectElement
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } })

    const search = screen.getByTestId('clientes-search-input') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'a' } })

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      // All 3 SAMPLE clientes contain "a" (case-insensitive). Asc by nombre:
      //   Acme Industrial, Comercializadora Andina, Distribuciones del Pacífico.
      expect(items.length).toBeGreaterThan(0)
      expect(within(items[0]).getByText(/acme industrial/i)).toBeInTheDocument()
    })

    // SortControl still shows `nombre-asc`.
    expect(sortControl.value).toBe('nombre-asc')
  })
})

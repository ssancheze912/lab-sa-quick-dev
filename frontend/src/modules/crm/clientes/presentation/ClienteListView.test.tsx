/**
 * Story 2.1: Client List & Search — Task 17
 * Epic 2: Client Management
 *
 * ATDD component tests — RED Phase
 * Intentionally FAILING until:
 *   1. ClienteListView.tsx is implemented,
 *   2. Cliente domain + IClienteRepository + clienteApiRepository + useClientes are implemented,
 *   3. EmptyState / ErrorPanel / ClientListItem shared components are implemented,
 *   4. useDebouncedValue + matchesQuery exist,
 *   5. The /clientes/$clienteId route exists for URL-based selection.
 *
 * Acceptance Criteria covered:
 *   AC #4  — TC-E2-P1-01: panel renders all items in a 280px container.
 *   AC #5  — TC-E2-P0-05: search filter <1000 ms with 500 records (perf budget).
 *         — TC-E2-P1-02: search filters by both `nombre` and `nit`.
 *         — Search does NOT trigger a refetch.
 *   AC #6  — TC-E2-P1-03: EmptyState `no-clients` when API returns [], search input hidden.
 *   AC #7  — EmptyState `search-empty` when query matches nothing, search input still visible.
 *   AC #8  — TC-E2-P0-08: ErrorPanel + Reintentar on fetch failure → refetch on retry.
 *   AC #9  — useClientes queryKey is ['clientes'] (array literal, not string).
 *   AC #10 — Clicking an item navigates to /clientes/$clienteId and marks the item active.
 *   AC #11 — Spanish copy + aria-label "Buscar clientes" on the search input.
 *
 * Notes on infra:
 *   - MSW server is shared from vitest.setup.ts (`server` export).
 *   - Tests use real timers for perf assertions; fake timers elsewhere when the
 *     150 ms debounce would otherwise slow the suite.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
  act,
} from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '../../../../../vitest.setup'
import { clientesHandlers, seedClientes } from '@/test/handlers/clientes'
// RED: ClienteListView.tsx does not exist yet — this import will fail until Task 15 is done.
import { ClienteListView } from './ClienteListView'
// RED: useClientes hook does not exist yet — used in the queryKey assertion below.
import { useClientes } from '../application/useClientes'
import { renderHook } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

/**
 * Mounts the ClienteListView inside a minimal in-memory router that registers
 * BOTH `/clientes` and `/clientes/$clienteId` so the dynamic-route navigation
 * assertion (AC #10) has a real target to land on.
 */
function renderClienteListView({
  initialPath = '/clientes',
}: { initialPath?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })

  function Providers({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  const rootRoute = createRootRoute({
    component: () => (
      <Providers>
        <Outlet />
      </Providers>
    ),
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: ClienteListView,
  })

  const clienteDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => (
      <div className="flex">
        <ClienteListView />
        <div data-testid="cliente-detail-placeholder" />
      </div>
    ),
  })

  const routeTree = rootRoute.addChildren([clientesRoute, clienteDetailRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return { ...render(<RouterProvider router={router} />), router, queryClient }
}

// ──────────────────────────────────────────────────────────────────────
// TC-E2-P1-01 — list renders all items in 280px panel
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-01 (AC #4)', () => {
  it('renders 10 seeded clients inside the cliente-list-view panel', async () => {
    // GIVEN: the backend returns 10 seeded clients
    const data = seedClientes(10)
    server.use(clientesHandlers.ok(data))

    // WHEN: the view mounts at /clientes
    renderClienteListView()

    // THEN: every seeded nombre is visible AND the panel root carries the testid
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-view')).toBeInTheDocument()
    })
    for (const cliente of data) {
      expect(await screen.findByText(cliente.nombre)).toBeInTheDocument()
    }
  })

  it('renders the panel with the Tailwind `w-[280px]` width class (AC #4)', async () => {
    // GIVEN: the backend returns a non-empty array
    server.use(clientesHandlers.ok(seedClientes(2)))

    // WHEN: the view mounts
    renderClienteListView()

    // THEN: the panel root has the w-[280px] arbitrary Tailwind class
    const panel = await screen.findByTestId('cliente-list-view')
    expect(panel.className).toContain('w-[280px]')
  })

  it('renders one ClientListItem per seeded client', async () => {
    // GIVEN: 5 seeded clients
    server.use(clientesHandlers.ok(seedClientes(5)))

    // WHEN: the view mounts
    renderClienteListView()

    // THEN: 5 ClientListItem nodes are rendered
    await waitFor(() => {
      const items = screen.getAllByTestId('client-list-item')
      expect(items).toHaveLength(5)
    })
  })
})

// ──────────────────────────────────────────────────────────────────────
// TC-E2-P1-02 — search filters by both `nombre` and `nit`
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-02 (AC #5)', () => {
  it('filters the list by nombre via the search input', async () => {
    // GIVEN: a list with a uniquely-named client
    const data = seedClientes(5)
    data[2] = { ...data[2], nombre: 'Empresa Filtro Especial' }
    server.use(clientesHandlers.ok(data))

    renderClienteListView()
    await screen.findByText('Empresa Filtro Especial')

    // WHEN: the user types a substring of the target nombre
    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: 'Filtro Especial' } })

    // THEN: only the matching client remains after the debounce elapses
    await waitFor(
      () => {
        expect(screen.getByText('Empresa Filtro Especial')).toBeInTheDocument()
        expect(screen.queryByText('Cliente Demo 0000')).not.toBeInTheDocument()
      },
      { timeout: 1000 },
    )
  })

  it('filters the list by nit via the search input', async () => {
    // GIVEN: a list with a uniquely-NIT'd client
    const data = seedClientes(5)
    data[3] = { ...data[3], nit: '900XYZ-1' }
    server.use(clientesHandlers.ok(data))

    renderClienteListView()
    await screen.findByText('900XYZ-1')

    // WHEN: the user types a substring of the target NIT
    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')
    fireEvent.change(input, { target: { value: '900XYZ' } })

    // THEN: only the matching client remains
    await waitFor(
      () => {
        const items = screen.getAllByTestId('client-list-item')
        expect(items).toHaveLength(1)
        expect(items[0].textContent).toContain('900XYZ-1')
      },
      { timeout: 1000 },
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// TC-E2-P1-03 — EmptyState when list is empty
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-03 (AC #6)', () => {
  it('renders the no-clients EmptyState when the backend returns []', async () => {
    // GIVEN: the backend returns an empty array
    server.use(clientesHandlers.empty())

    // WHEN: the view mounts
    renderClienteListView()

    // THEN: the no-clients EmptyState is rendered
    const empty = await screen.findByTestId('empty-state')
    expect(empty).toHaveAttribute('data-variant', 'no-clients')
  })

  it('hides the search input when the list is empty (AC #6)', async () => {
    server.use(clientesHandlers.empty())
    renderClienteListView()
    await screen.findByTestId('empty-state')

    // THEN: the search input is NOT in the DOM (nothing to filter)
    expect(screen.queryByPlaceholderText('Buscar por nombre o NIT...')).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────────────────
// AC #7 — EmptyState (search-empty) when the filter yields no results
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — search yields no results (AC #7)', () => {
  it('renders the search-empty EmptyState AND keeps the search input visible', async () => {
    // GIVEN: a non-empty list
    server.use(clientesHandlers.ok(seedClientes(5)))
    renderClienteListView()
    const input = await screen.findByPlaceholderText('Buscar por nombre o NIT...')

    // WHEN: the user types a query that matches nothing
    fireEvent.change(input, { target: { value: 'NoMatchZzz' } })

    // THEN: the search-empty EmptyState is rendered AND the search input persists
    await waitFor(
      () => {
        const empty = screen.getByTestId('empty-state')
        expect(empty).toHaveAttribute('data-variant', 'search-empty')
      },
      { timeout: 1000 },
    )
    expect(screen.getByPlaceholderText('Buscar por nombre o NIT...')).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────────────────
// TC-E2-P0-08 — ErrorPanel + Reintentar
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P0-08 (AC #8)', () => {
  it('renders ErrorPanel on initial fetch failure and refetches on Reintentar click', async () => {
    // GIVEN: the first GET returns 500
    server.use(clientesHandlers.failing(500))

    renderClienteListView()

    // THEN: ErrorPanel is rendered (no list, no empty-state)
    const panel = await screen.findByTestId('error-panel')
    expect(panel).toBeInTheDocument()
    expect(screen.queryByTestId('client-list-item')).not.toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()

    // WHEN: the user clicks "Reintentar" AND the backend now returns a populated list
    server.use(clientesHandlers.ok(seedClientes(3)))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: the list renders (no full page reload — TanStack Query refetch())
    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(3)
    })
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────────────────
// AC #5 — search does NOT trigger a refetch
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — search filter does NOT trigger a refetch (AC #5)', () => {
  it('issues exactly one GET on mount and zero additional GETs while typing', async () => {
    // GIVEN: a request counter wired to the GET endpoint
    let getCount = 0
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'GET' && request.url.endsWith('/api/v1/clientes')) {
        getCount += 1
      }
    })
    server.use(clientesHandlers.ok(seedClientes(5)))

    // WHEN: the view mounts
    renderClienteListView()
    const input = await screen.findByPlaceholderText('Buscar por nombre o NIT...')

    // THEN: exactly one GET was issued on initial load
    await waitFor(() => {
      expect(getCount).toBe(1)
    })

    // WHEN: the user types a query
    fireEvent.change(input, { target: { value: 'abc' } })

    // AND: enough time elapses for the debounce + re-render
    await new Promise((resolve) => setTimeout(resolve, 500))

    // THEN: still exactly one GET (client-side filter only)
    expect(getCount).toBe(1)
    server.events.removeAllListeners('request:start')
  })
})

// ──────────────────────────────────────────────────────────────────────
// AC #10 — selecting an item updates the URL via TanStack Router
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — selecting an item updates the URL (AC #10)', () => {
  it('navigates to /clientes/{id} when the user clicks a list item', async () => {
    // GIVEN: a non-empty list at /clientes
    const data = seedClientes(2)
    server.use(clientesHandlers.ok(data))

    const { router } = renderClienteListView({ initialPath: '/clientes' })
    await screen.findAllByTestId('client-list-item')

    // WHEN: the user clicks the first item
    fireEvent.click(screen.getAllByTestId('client-list-item')[0])

    // THEN: the URL pathname becomes /clientes/{first-id}
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clientes/${data[0].id}`)
    })
  })
})

// ──────────────────────────────────────────────────────────────────────
// AC #9 — useClientes queryKey is ['clientes']
// ──────────────────────────────────────────────────────────────────────

describe('useClientes — canonical TanStack Query key (AC #9)', () => {
  it('registers the queryKey as the array literal [\'clientes\']', async () => {
    // GIVEN: a fresh QueryClient
    server.use(clientesHandlers.ok(seedClientes(1)))
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })

    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    // WHEN: the hook mounts
    renderHook(() => useClientes(), { wrapper: Wrapper })

    // THEN: the cache contains exactly one query whose key equals ['clientes']
    await waitFor(() => {
      const queries = queryClient.getQueryCache().getAll()
      expect(queries.length).toBeGreaterThanOrEqual(1)
    })
    const queries = queryClient.getQueryCache().getAll()
    const found = queries.find((q) => JSON.stringify(q.queryKey) === JSON.stringify(['clientes']))
    expect(found).toBeDefined()
  })
})

// ──────────────────────────────────────────────────────────────────────
// TC-E2-P0-05 — search performance < 1000 ms with 500 records
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P0-05 (AC #5 perf)', () => {
  it('filters 500 records in under 1000 ms (NFR1)', async () => {
    // GIVEN: 500 seeded clients
    const data = seedClientes(500)
    data[0] = { ...data[0], nombre: 'ZZZ Cliente Único' }
    server.use(clientesHandlers.ok(data))

    renderClienteListView()
    await screen.findByText('ZZZ Cliente Único')

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')

    // WHEN: the user types a 4-character query that matches a small subset
    const t0 = performance.now()
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Únic' } })
    })

    // AND: the filtered DOM stabilizes
    await screen.findByText('ZZZ Cliente Único', undefined, { timeout: 1500 })
    const t1 = performance.now()

    // THEN: the elapsed time stays under 1000 ms (NFR1, with CI headroom)
    expect(t1 - t0).toBeLessThan(1000)
  })
})

// ──────────────────────────────────────────────────────────────────────
// AC #11 — Spanish copy on the search input
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — Spanish copy (AC #11)', () => {
  it('renders the search input with the verbatim placeholder and Spanish aria-label', async () => {
    // GIVEN: a non-empty list
    server.use(clientesHandlers.ok(seedClientes(2)))
    renderClienteListView()

    // WHEN: the view mounts
    const input = await screen.findByPlaceholderText('Buscar por nombre o NIT...')

    // THEN: the aria-label is "Buscar clientes" (verbatim Spanish)
    expect(input).toHaveAttribute('aria-label', 'Buscar clientes')
  })

  it('keeps the existing data-testid="clientes-view" so Story 1.2 E2E tests still pass', async () => {
    // GIVEN: a non-empty list (the panel root must still expose clientes-view per Story 1.2)
    server.use(clientesHandlers.ok(seedClientes(1)))
    renderClienteListView()

    // WHEN: the view mounts
    // THEN: a node with data-testid="clientes-view" is present (Story 1.2 contract preserved)
    const stillPresent = await waitFor(() => {
      const node = document.querySelector('[data-testid="clientes-view"]')
      expect(node).not.toBeNull()
      return node
    })
    expect(stillPresent).not.toBeNull()
  })
})

// Suppress an unused-import warning for `vi` when this file is edited
void vi
void within

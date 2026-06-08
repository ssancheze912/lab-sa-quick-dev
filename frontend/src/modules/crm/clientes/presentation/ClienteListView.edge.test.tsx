/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
 * Complements `ClienteListView.test.tsx` with: clearing-search recovery,
 * rapid-typing race, switching between selected items, and skeleton-loading
 * boundary behaviors.
 *
 * Acceptance Criteria touched:
 *   AC #4 / #5 / #6 / #7 / #8 / #10 — runtime interaction edges.
 *   AC #11 — Spanish copy preserved across state transitions.
 */

import { describe, it, expect, afterEach } from 'vitest'
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
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
import { ClienteListView } from './ClienteListView'

afterEach(() => {
  cleanup()
})

/**
 * Mounts the view in a minimal router that registers both `/clientes`
 * and `/clientes/$clienteId` routes — mirrors the ATDD test harness so
 * selection assertions land on a real dynamic route.
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
// Clearing-search recovery (AC #5 + #7 transition)
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — clearing the search after a match restores the full list', () => {
  it('[P1] clearing the input restores every item that was filtered out', async () => {
    // GIVEN: 5 seeded clients with a uniquely-named one
    const data = seedClientes(5)
    data[2] = { ...data[2], nombre: 'Empresa Única' }
    server.use(clientesHandlers.ok(data))

    renderClienteListView()
    await screen.findByText('Empresa Única')

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')

    // WHEN: the user filters down to one item
    fireEvent.change(input, { target: { value: 'Única' } })
    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(1)
    }, { timeout: 1000 })

    // WHEN: the user clears the search input
    fireEvent.change(input, { target: { value: '' } })

    // THEN: every original item is back (filter predicate returns true for empty query)
    await waitFor(() => {
      expect(screen.getAllByTestId('client-list-item')).toHaveLength(5)
    }, { timeout: 1000 })
  })

  it('[P2] transitioning from search-empty back to a matching query removes the EmptyState', async () => {
    // GIVEN: 3 seeded clients
    const data = seedClientes(3)
    data[0] = { ...data[0], nombre: 'Andina S.A.' }
    server.use(clientesHandlers.ok(data))

    renderClienteListView()
    await screen.findByText('Andina S.A.')

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')

    // WHEN: a non-matching query is typed
    fireEvent.change(input, { target: { value: 'ZZZZ-no-match' } })
    await waitFor(() => {
      const empty = screen.getByTestId('empty-state')
      expect(empty).toHaveAttribute('data-variant', 'search-empty')
    }, { timeout: 1000 })

    // WHEN: the user types a matching query
    fireEvent.change(input, { target: { value: 'Andina' } })

    // THEN: the empty state goes away and the matching client renders
    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
      expect(screen.getByText('Andina S.A.')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})

// ──────────────────────────────────────────────────────────────────────
// Rapid-typing race condition (AC #5 — debounce contract)
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — rapid typing applies only the final value after debounce', () => {
  it('[P1] typing 3 distinct queries in <150ms applies only the last one', async () => {
    // GIVEN: 5 clients, one with a unique nombre
    const data = seedClientes(5)
    data[0] = { ...data[0], nombre: 'Final Match' }
    server.use(clientesHandlers.ok(data))

    renderClienteListView()
    await screen.findByText('Final Match')

    const input = screen.getByPlaceholderText('Buscar por nombre o NIT...')

    // WHEN: the user types three rapid changes — only the last should drive the filter
    fireEvent.change(input, { target: { value: 'X' } })
    fireEvent.change(input, { target: { value: 'NoMatch' } })
    fireEvent.change(input, { target: { value: 'Final' } })

    // THEN: after the debounce settles, only "Final Match" remains
    await waitFor(() => {
      const items = screen.getAllByTestId('client-list-item')
      expect(items).toHaveLength(1)
      expect(items[0].textContent).toContain('Final Match')
    }, { timeout: 1000 })
  })
})

// ──────────────────────────────────────────────────────────────────────
// Changing the selected item updates aria-current on the right row (AC #10)
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — selecting a different item moves the active marker', () => {
  it('[P1] aria-current="page" tracks the currently-selected client when the URL changes', async () => {
    // GIVEN: two seeded clients — start at /clientes/{first}
    const data = seedClientes(2)
    server.use(clientesHandlers.ok(data))

    const { router } = renderClienteListView({ initialPath: `/clientes/${data[0].id}` })
    await screen.findAllByTestId('client-list-item')

    // WHEN: the user clicks the second item
    fireEvent.click(screen.getAllByTestId('client-list-item')[1])

    // THEN: the URL becomes /clientes/{second-id} AND aria-current moves to that row
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clientes/${data[1].id}`)
    })
    await waitFor(() => {
      const items = screen.getAllByTestId('client-list-item')
      expect(items[0]).not.toHaveAttribute('aria-current')
      expect(items[1]).toHaveAttribute('aria-current', 'page')
    })
  })
})

// ──────────────────────────────────────────────────────────────────────
// Skeleton state (AC #4 loading boundary)
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — skeleton placeholder during first load', () => {
  it('[P2] shows neither EmptyState nor ErrorPanel before the first response resolves', async () => {
    // GIVEN: a delayed handler so we can observe the loading state
    server.use(clientesHandlers.delayed(100, seedClientes(2)))

    // WHEN: the view mounts
    renderClienteListView()

    // THEN: ErrorPanel/EmptyState are NOT rendered while loading is in-flight
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()

    // WHEN: the data eventually arrives
    await waitFor(
      () => {
        expect(screen.getAllByTestId('client-list-item').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    // THEN: ErrorPanel + EmptyState are still not present (happy path completed)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────────────────
// Story 1.2 contract: data-testid="clientes-view" remains on the root region
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — Story 1.2 contract preservation', () => {
  it('[P1] keeps the legacy data-testid="clientes-view" even when the list is empty', async () => {
    // GIVEN: an empty list (the legacy testid must persist regardless of state)
    server.use(clientesHandlers.empty())
    renderClienteListView()
    await screen.findByTestId('empty-state')

    // WHEN / THEN: the Story 1.2 selector still finds the marker (deep-linking.spec.ts depends on it)
    const legacyMarker = document.querySelector('[data-testid="clientes-view"]')
    expect(legacyMarker).not.toBeNull()
  })

  it('[P1] keeps data-testid="clientes-view" when the fetch fails', async () => {
    // GIVEN: a 500 from the API
    server.use(clientesHandlers.failing(500))
    renderClienteListView()
    await screen.findByTestId('error-panel')

    // WHEN / THEN: the legacy marker persists across error states too
    const legacyMarker = document.querySelector('[data-testid="clientes-view"]')
    expect(legacyMarker).not.toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────
// Search input value reflects user typing immediately (UX responsiveness)
// ──────────────────────────────────────────────────────────────────────

describe('ClienteListView — search input value is uncontrolled by debounce', () => {
  it('[P2] the input value updates instantly while only the filter recomputes lazily', async () => {
    // GIVEN: 3 seeded clients
    server.use(clientesHandlers.ok(seedClientes(3)))
    renderClienteListView()
    const input = (await screen.findByPlaceholderText(
      'Buscar por nombre o NIT...',
    )) as HTMLInputElement

    // WHEN: the user types into the input
    fireEvent.change(input, { target: { value: 'abc' } })

    // THEN: the input value reflects the typed text immediately (no jitter for the user),
    // independent of the 150 ms debounce that gates the filter recomputation.
    expect(input.value).toBe('abc')
  })
})

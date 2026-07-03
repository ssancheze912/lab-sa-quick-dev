/**
 * Story 2.1 — Client List & Search — Component ATDD (RED phase)
 * Epic 2: Client Management
 *
 * These tests define the expected behavior of `<ClienteListView>` BEFORE the
 * implementation exists. They will fail until Task 6 (domain/application/
 * infrastructure layer), Task 7 (EmptyState + ErrorPanel), and Task 8
 * (ClienteListView + ClientListItem) are complete.
 *
 * Test cases covered:
 *   TC-E2-P1-01 — Renders 500-item fixture + search filter updates DOM in < 1 s
 *   TC-E2-P1-02 — EmptyState renders when API returns []
 *   TC-E2-P1-03 — ErrorPanel + Reintentar renders on failure; retry succeeds
 *   Skeleton     — react-loading-skeleton visible while query is pending
 *
 * ACs covered: #1 (list panel), #2 (search filter), #3 (EmptyState),
 * #4 (ErrorPanel + Reintentar), #5 (loading skeleton), #11 (Spanish copy).
 *
 * Given-When-Then structure. Network-first (MSW handlers configured before
 * mount). Selectors are data-testid only.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import {
  clientesHandlers,
  makeCliente,
  resetClienteFactoryCounter,
} from '@/test/handlers/clientes'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first: handlers are set BEFORE each render
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  cleanup()
  resetClienteFactoryCounter()
})

// ─────────────────────────────────────────────────────────────────────────────
// Test harness: fresh QueryClient per test with retries disabled so component
// failure paths surface immediately (no exponential backoff in tests).
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderWithClient(ui: ReactNode) {
  const client = makeQueryClient()
  // Story 2.2: ClientListItem uses a TanStack Router <Link>, so a router
  // context is now mandatory even when unit-testing <ClienteListView>.
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <>{ui}</>,
  })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => <>{ui}</>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: ['/clientes'] }),
  })
  const utils = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...utils, client }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-01 — List renders + client-side search < 1 s over 500 items
// AC covered: #1, #2, #11
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-01: list renders and search filters in < 1 s (500 items)', () => {
  it('should render all 500 clients on initial load', async () => {
    // GIVEN: MSW returns 500 clients
    const fixture: Cliente[] = Array.from({ length: 500 }, (_, i) =>
      makeCliente({
        id: `00000000-0000-4000-8000-${i.toString().padStart(12, '0')}`,
        nombre: `Cliente ${i}`,
        nitRuc: `NIT-${i.toString().padStart(6, '0')}`,
      }),
    )
    server.use(clientesHandlers.list(fixture))

    // WHEN: The list view mounts
    renderWithClient(<ClienteListView />)

    // THEN: All 500 items are eventually rendered in the list
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    })
  })

  it('should render the search input with Spanish placeholder', async () => {
    // GIVEN: MSW returns any client set
    server.use(clientesHandlers.list([makeCliente()]))

    // WHEN: The list view mounts
    renderWithClient(<ClienteListView />)

    // THEN: A search input labeled in Spanish is present
    const search = await screen.findByTestId('cliente-list-search')
    expect(search).toHaveAttribute('placeholder', expect.stringMatching(/buscar cliente/i))
  })

  it('should filter the visible list to items matching "Cliente 42" after typing', async () => {
    // GIVEN: MSW returns 500 clients with predictable names
    const fixture: Cliente[] = Array.from({ length: 500 }, (_, i) =>
      makeCliente({
        id: `00000000-0000-4000-8000-${i.toString().padStart(12, '0')}`,
        nombre: `Cliente ${i}`,
        nitRuc: `NIT-${i.toString().padStart(6, '0')}`,
      }),
    )
    server.use(clientesHandlers.list(fixture))

    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500),
    )

    // WHEN: The user types "Cliente 42" in the search input
    const user = userEvent.setup({ delay: null })
    const search = screen.getByTestId('cliente-list-search')
    await user.type(search, 'Cliente 42')

    // THEN: Only items whose nombre contains "Cliente 42" remain visible.
    //       500 range → 42, 142, 242, 342, 420–429, 442 → 14 matches.
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      // Every visible item must contain "Cliente 42" as substring
      expect(
        items.every((el) => /cliente 42/i.test(el.textContent ?? '')),
      ).toBe(true)
      // And the fully unfiltered count must have shrunk.
      expect(items.length).toBeLessThan(500)
      expect(items.length).toBeGreaterThan(0)
    })
  })

  it('should complete the search → filtered DOM update in under 1 second (NFR1)', async () => {
    // GIVEN: MSW returns 500 clients
    const fixture: Cliente[] = Array.from({ length: 500 }, (_, i) =>
      makeCliente({
        id: `00000000-0000-4000-8000-${i.toString().padStart(12, '0')}`,
        nombre: `Cliente ${i}`,
      }),
    )
    server.use(clientesHandlers.list(fixture))

    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500),
    )

    // WHEN: The user types a filter query and the DOM updates
    const user = userEvent.setup({ delay: null })
    const search = screen.getByTestId('cliente-list-search')

    const started = performance.now()
    await user.type(search, 'Cliente 123')
    await waitFor(() => {
      const items = screen.queryAllByTestId('cliente-list-item')
      expect(items.length).toBeLessThan(500)
    })
    const elapsedMs = performance.now() - started

    // THEN: The full type + filter cycle completes in under 1 second (NFR1)
    expect(elapsedMs).toBeLessThan(1000)
  })

  it('should NOT trigger a second GET on keystrokes (client-side filtering)', async () => {
    // GIVEN: An MSW handler that counts requests
    let getCount = 0
    const fixture: Cliente[] = Array.from({ length: 10 }, (_, i) =>
      makeCliente({ nombre: `Cliente ${i}` }),
    )
    server.use(
      http.get('*/api/v1/clientes', () => {
        getCount += 1
        return HttpResponse.json(fixture)
      }),
    )

    renderWithClient(<ClienteListView />)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(10),
    )
    const baselineCount = getCount

    // WHEN: The user types multiple keystrokes into the search input
    const user = userEvent.setup({ delay: null })
    const search = screen.getByTestId('cliente-list-search')
    await user.type(search, 'Cliente')

    // THEN: The GET count has not increased — search is client-side over cache
    expect(getCount).toBe(baselineCount)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-02 — EmptyState renders when backend returns []
// AC covered: #3
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-02: EmptyState on empty response', () => {
  it('should render the EmptyState when the API returns []', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clientesHandlers.empty())

    // WHEN: The list view mounts and the query resolves
    renderWithClient(<ClienteListView />)

    // THEN: The EmptyState component is visible
    const emptyState = await screen.findByTestId('empty-state')
    expect(emptyState).toBeInTheDocument()
  })

  it('should NOT render the list container when the API returns []', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clientesHandlers.empty())

    // WHEN: The list view mounts and the query resolves
    renderWithClient(<ClienteListView />)
    await screen.findByTestId('empty-state')

    // THEN: The scrollable list container is NOT rendered simultaneously
    expect(screen.queryByTestId('cliente-list')).toBeNull()
  })

  it('should NOT render a loading skeleton once the empty response resolves', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clientesHandlers.empty())

    // WHEN: The list view mounts and the query resolves
    renderWithClient(<ClienteListView />)
    await screen.findByTestId('empty-state')

    // THEN: The loading skeleton is not present alongside the EmptyState
    //       (the R12 mitigation — `data?.length === 0 && !isLoading`).
    expect(screen.queryByTestId('cliente-list-skeleton')).toBeNull()
  })

  it('should render Spanish copy in the EmptyState', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clientesHandlers.empty())

    // WHEN: The list view mounts and the query resolves
    renderWithClient(<ClienteListView />)

    // THEN: The EmptyState displays a Spanish message
    const emptyState = await screen.findByTestId('empty-state')
    expect(emptyState.textContent ?? '').toMatch(/aún no hay clientes/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-03 — ErrorPanel + Reintentar renders on failure; retry succeeds
// AC covered: #4
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-03: ErrorPanel + Reintentar on backend failure', () => {
  it('should render the ErrorPanel when GET /api/v1/clientes fails with 500', async () => {
    // GIVEN: MSW returns 500 on the initial fetch
    server.use(clientesHandlers.error(500))

    // WHEN: The list view mounts and the query rejects
    renderWithClient(<ClienteListView />)

    // THEN: The ErrorPanel is rendered
    const errorPanel = await screen.findByTestId('error-panel')
    expect(errorPanel).toBeInTheDocument()
  })

  it('should expose a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: MSW returns 500 on the initial fetch
    server.use(clientesHandlers.error(500))

    // WHEN: The list view mounts and the query rejects
    renderWithClient(<ClienteListView />)
    const errorPanel = await screen.findByTestId('error-panel')

    // THEN: The retry button labelled "Reintentar" is present inside the panel
    const retryBtn = within(errorPanel).getByTestId('error-panel-retry')
    expect(retryBtn.textContent ?? '').toMatch(/reintentar/i)
  })

  it('should refetch and render the list when Reintentar is clicked', async () => {
    // GIVEN: MSW starts by returning 500; then swaps to a happy-path response
    let hitCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        hitCount += 1
        if (hitCount === 1) {
          return new HttpResponse(null, { status: 500 })
        }
        return HttpResponse.json([makeCliente({ nombre: 'Cliente Recovered' })])
      }),
    )

    renderWithClient(<ClienteListView />)
    const errorPanel = await screen.findByTestId('error-panel')
    const retryBtn = within(errorPanel).getByTestId('error-panel-retry')

    // WHEN: The user clicks Reintentar
    const user = userEvent.setup({ delay: null })
    await user.click(retryBtn)

    // THEN: The list eventually renders with the recovered item AND the MSW
    //       counter proves refetch was called (1 → 2).
    const item = await screen.findByTestId('cliente-list-item')
    expect(item.textContent ?? '').toMatch(/cliente recovered/i)
    expect(hitCount).toBe(2)
  })

  it('should NOT expose raw HTTP status or error.message to the user (NFR6)', async () => {
    // GIVEN: MSW returns 500
    server.use(clientesHandlers.error(500))

    // WHEN: The list view mounts and the query rejects
    renderWithClient(<ClienteListView />)
    const errorPanel = await screen.findByTestId('error-panel')

    // THEN: The panel copy is in Spanish and does not leak "500"/"Error"/stack
    const text = errorPanel.textContent ?? ''
    expect(text).not.toMatch(/500/)
    expect(text).not.toMatch(/error:.*\{/i)
    expect(text).not.toMatch(/stack/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton — react-loading-skeleton visible while query is pending
// AC covered: #5
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Loading skeleton visible while fetching', () => {
  it('should render the loading skeleton before the query resolves', async () => {
    // GIVEN: MSW delays the response by 300 ms so `isLoading` stays true briefly
    server.use(clientesHandlers.listDelayed([makeCliente()], 300))

    // WHEN: The list view mounts (query is pending)
    renderWithClient(<ClienteListView />)

    // THEN: The skeleton placeholder is present in the initial render
    const skeleton = await screen.findByTestId('cliente-list-skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('should dismiss the skeleton once the query resolves with data', async () => {
    // GIVEN: MSW returns a short delayed happy-path response
    server.use(clientesHandlers.listDelayed([makeCliente()], 50))

    // WHEN: The list view mounts and the query eventually resolves
    renderWithClient(<ClienteListView />)

    // THEN: After resolution, the list is rendered and the skeleton is gone
    await screen.findByTestId('cliente-list')
    expect(screen.queryByTestId('cliente-list-skeleton')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Master-detail layout — 280 px left panel is present at desktop viewport
// AC covered: #1
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Master-detail layout: 280 px left panel', () => {
  it('should mount the cliente-list-panel wrapper at desktop viewport', async () => {
    // GIVEN: MSW returns any client set (desktop match-media shimmed by setup.ts)
    server.use(clientesHandlers.list([makeCliente()]))

    // WHEN: The list view mounts
    renderWithClient(<ClienteListView />)

    // THEN: The list panel with data-testid="cliente-list-panel" is rendered
    const panel = await screen.findByTestId('cliente-list-panel')
    expect(panel).toBeInTheDocument()
  })
})

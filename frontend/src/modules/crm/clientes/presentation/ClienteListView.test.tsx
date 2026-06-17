/**
 * Story 2.1: Client List & Search — Component Tests
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL + MSW)
 * These tests FAIL until the implementation is complete.
 *
 * Test IDs covered:
 *   TC-E2-P1-03 — EmptyState rendered when API returns []
 *   TC-E2-P1-04 — ErrorPanel with "Reintentar" button on network error; retry fires new GET
 *   TC-E2-P1-05 — Real-time search by Nombre — only matching clients visible
 *   TC-E2-P1-06 — Real-time search by NIT/RUC — correct subset shown
 *   TC-E2-P2-01 — Filter 500 records < 1000ms (NFR1)
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories — no hardcoded values
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 0
function uniqueSuffix() {
  return `${Date.now()}-${++_counter}`
}

function buildClienteDto(overrides?: Partial<Cliente>): Cliente {
  const suffix = uniqueSuffix()
  return {
    id: crypto.randomUUID(),
    nombre: `Empresa Test ${suffix}`,
    nitRuc: `900${suffix.slice(-6).padStart(6, '0')}-1`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function buildClienteDtos(count: number, overrides?: Partial<Cliente>[]): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    buildClienteDto(overrides?.[i])
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup — intercept GET /api/v1/clientes
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a fresh QueryClient for each test to ensure isolation.
 * Disables retries so MSW errors fail fast.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

/**
 * Creates a minimal TanStack Router with a stub route that renders ClienteListView.
 * Required because ClientListItem now uses TanStack Router <Link>.
 */
function createTestRouter(queryClient: QueryClient) {
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <ClienteListView />
      </QueryClientProvider>
    ),
  })

  const clienteDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => <div data-testid="cliente-detail-stub" />,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([clienteDetailRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return router
}

/**
 * Renders ClienteListView wrapped in the required providers.
 */
function renderClienteListView() {
  const queryClient = createQueryClient()
  const router = createTestRouter(queryClient)
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-03: EmptyState rendered when MSW returns []
// AC3: "Given there are no clients, When user navigates, Then EmptyState is displayed"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-03 — EmptyState on empty API response', () => {
  it('should render EmptyState when the API returns an empty array', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes and returns []
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: EmptyState component is visible in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('should NOT render any client list items when API returns empty array', async () => {
    // GIVEN: MSW returns []
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: No cliente-list-item elements exist in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('should NOT render ErrorPanel when API returns empty array (200 [])', async () => {
    // GIVEN: MSW returns HTTP 200 with empty array
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: ErrorPanel must NOT be present
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('should display the guiding message in EmptyState', async () => {
    // GIVEN: MSW returns empty array
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: The EmptyState shows the guiding message in Spanish
    await waitFor(() => {
      expect(
        screen.getByText(/no hay clientes registrados/i)
      ).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-04: ErrorPanel with Reintentar on network error
// AC4: "Given backend is unavailable, Then ErrorPanel with Reintentar is displayed"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-04 — ErrorPanel on network error', () => {
  it('should render ErrorPanel when the API call fails with a network error', async () => {
    // GIVEN: MSW simulates a network error for GET /api/v1/clientes
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.error()
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: ErrorPanel is visible
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('should display a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.error()
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: A button with "Reintentar" text is visible
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /reintentar/i })
      ).toBeInTheDocument()
    })
  })

  it('should NOT render any client list items when ErrorPanel is displayed', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.error()
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: No list items in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('should fire a new GET /api/v1/clientes request when Reintentar is clicked', async () => {
    // GIVEN: MSW tracks how many times the endpoint is called
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.error()
      })
    )

    // WHEN: ClienteListView is rendered and ErrorPanel appears
    renderClienteListView()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })

    const initialCallCount = callCount

    // WHEN: User clicks the Reintentar button
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: A new GET request is fired (callCount increased)
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCallCount)
    })
  })

  it('should NOT render EmptyState when ErrorPanel is displayed', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.error()
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: EmptyState must NOT be present
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05: Real-time search filters by Nombre
// AC2: "When user types in search field, list filters by Nombre (case-insensitive)"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-05 — Real-time search filters by Nombre', () => {
  it('should show only matching clients when user types a Nombre search term', async () => {
    // GIVEN: MSW returns 3 clients
    const clientes = [
      buildClienteDto({ nombre: 'Acme Corp S.A.S.', nitRuc: '901001001-1' }),
      buildClienteDto({ nombre: 'Beta Industries Ltda.', nitRuc: '902002002-2' }),
      buildClienteDto({ nombre: 'Gamma Solutions Corp.', nitRuc: '903003003-3' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: User types "acme" in the search field
    const user = userEvent.setup()
    const searchInput = screen.getByRole('textbox', { name: /buscar cliente/i })
    await user.type(searchInput, 'acme')

    // THEN: Only the matching client is visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('Acme Corp S.A.S.')
    })
  })

  it('should NOT trigger an additional API call when search input changes', async () => {
    // GIVEN: MSW returns 3 clients and tracks calls
    let callCount = 0
    const clientes = buildClienteDtos(3)
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json(clientes, { status: 200 })
      })
    )

    renderClienteListView()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
    const callsAfterLoad = callCount

    // WHEN: User types a search term
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      'test'
    )

    // THEN: No additional API calls — filter is synchronous over cached data
    expect(callCount).toBe(callsAfterLoad)
  })

  it('should perform case-insensitive Nombre search', async () => {
    // GIVEN: Client with uppercase Nombre
    const clientes = [
      buildClienteDto({ nombre: 'EMPRESA MAYUSCULA S.A.' }),
      buildClienteDto({ nombre: 'Empresa Diferente Ltda.' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User types in lowercase
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      'empresa mayuscula'
    )

    // THEN: The uppercase client is still visible (case-insensitive match)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('EMPRESA MAYUSCULA S.A.')
    })
  })

  it('should restore full list when search input is cleared', async () => {
    // GIVEN: 3 clients loaded, search applied
    const clientes = buildClienteDtos(3, [
      { nombre: 'Cliente Primero' },
      { nombre: 'Cliente Segundo' },
      { nombre: 'Cliente Tercero' },
    ])
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    const user = userEvent.setup()
    const searchInput = screen.getByRole('textbox', { name: /buscar cliente/i })
    await user.type(searchInput, 'Primero')

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // WHEN: User clears the search input
    await user.clear(searchInput)

    // THEN: All 3 clients are visible again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06: Real-time search filters by NIT/RUC
// AC2: "When user types NIT/RUC partial, only matching clients shown, no API call"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-06 — Real-time search filters by NIT/RUC', () => {
  it('should show only matching clients when user types a NIT/RUC partial', async () => {
    // GIVEN: MSW returns 3 clients with distinct NIT/RUC values
    const clientes = [
      buildClienteDto({ nombre: 'Empresa NIT Uno', nitRuc: '999888777-1' }),
      buildClienteDto({ nombre: 'Empresa NIT Dos', nitRuc: '111222333-2' }),
      buildClienteDto({ nombre: 'Empresa NIT Tres', nitRuc: '444555666-3' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: User types a partial NIT/RUC "999888"
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      '999888'
    )

    // THEN: Only the matching client (Empresa NIT Uno) is visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('Empresa NIT Uno')
    })
  })

  it('should NOT trigger an additional API call when filtering by NIT/RUC', async () => {
    // GIVEN: 3 clients, track API call count
    let callCount = 0
    const clientes = [
      buildClienteDto({ nitRuc: '999888777-1' }),
      buildClienteDto({ nitRuc: '111222333-2' }),
      buildClienteDto({ nitRuc: '444555666-3' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json(clientes, { status: 200 })
      })
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
    const callsAfterLoad = callCount

    // WHEN: User types a NIT/RUC search term
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      '999888'
    )

    // THEN: No additional API call (synchronous filter over cache)
    expect(callCount).toBe(callsAfterLoad)
  })

  it('should show no results when NIT/RUC search term does not match any client', async () => {
    // GIVEN: 2 clients, neither matches the search term
    const clientes = [
      buildClienteDto({ nombre: 'Empresa A', nitRuc: '111000111-1' }),
      buildClienteDto({ nombre: 'Empresa B', nitRuc: '222000222-2' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User types a NIT/RUC that doesn't match any client
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      '999999999'
    )

    // THEN: No client list items visible
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-01: Filter 500 records completes in < 1000ms (NFR1)
// AC2 NFR: "Results appear in under 1 second with up to 500 records"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-01 — Filter performance: 500 records < 1000ms (NFR1)', () => {
  it('should complete filtering of 500 clients in under 1000ms', async () => {
    // GIVEN: MSW returns 500 clients
    const clientes = buildClienteDtos(500)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()

    // Wait for all 500 items to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    }, { timeout: 10000 })

    const user = userEvent.setup()
    const searchInput = screen.getByRole('textbox', { name: /buscar cliente/i })

    // WHEN: User types a search term and we measure the filter time
    const start = performance.now()
    await user.type(searchInput, 'Empresa Test')
    const end = performance.now()

    const filterDurationMs = end - start

    // THEN: The filter completes in under 1000ms (NFR1)
    expect(filterDurationMs).toBeLessThan(1000)
  })

  it('should maintain filter correctness with 500 records', async () => {
    // GIVEN: 500 clients, one with a unique name
    const uniqueCliente = buildClienteDto({ nombre: 'UNIQUE_EMPRESA_FILTER_TEST_XYZ' })
    const otherClientes = buildClienteDtos(499)
    const clientes = [uniqueCliente, ...otherClientes]

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    }, { timeout: 10000 })

    // WHEN: User searches for the unique client
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      'UNIQUE_EMPRESA_FILTER_TEST_XYZ'
    )

    // THEN: Only the unique client is visible (correct filter with large dataset)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('UNIQUE_EMPRESA_FILTER_TEST_XYZ')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Additional: Accessibility attributes (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — WCAG 2.1 AA requirements', () => {
  it('should render a search input with aria-label="Buscar cliente"', async () => {
    // GIVEN: MSW returns some clients
    const clientes = buildClienteDtos(2)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // THEN: Search input has accessible aria-label
    expect(
      screen.getByRole('textbox', { name: /buscar cliente/i })
    ).toBeInTheDocument()
  })

  it('should render the client list with role="list"', async () => {
    // GIVEN: MSW returns some clients
    const clientes = buildClienteDtos(2)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // THEN: List container has role="list"
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('should render each client item with role="listitem"', async () => {
    // GIVEN: MSW returns 3 clients
    const clientes = buildClienteDtos(3)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // THEN: Each item has role="listitem"
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})

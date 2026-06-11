/**
 * Story 2.1: Client List & Search — Component Tests (RED Phase)
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * These tests are intentionally FAILING until the ClienteListPanel implementation exists.
 *
 * Test Cases covered:
 *   TC-E2-P1-05 — Real-time filter by nombre/NIT under 1000ms with 500 records (AC2, NFR1)
 *   TC-E2-P1-06 — EmptyState displayed when no clients exist (AC3)
 *   TC-E2-P1-07 — ErrorPanel with "Reintentar" on fetch failure, retry restores list (AC4)
 *
 * Architecture constraints verified:
 *   - Client-side filter via useMemo (no extra API calls on search)
 *   - TanStack Query key ['clientes']
 *   - data-testid selectors for stability
 *   - All user-facing text in Spanish
 */

import React from 'react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

// ─── Test Data Factories ──────────────────────────────────────────────────────

function buildCliente(overrides?: Partial<Cliente>): Cliente {
  const id = Math.random().toString(36).slice(2, 10)
  return {
    id: `00000000-0000-0000-0000-${id.padStart(12, '0')}`,
    nombre: `Cliente Test ${id}`,
    nit: `NIT-${id}`,
    telefono: `300${id.slice(0, 7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function buildClientes(count: number, overrides?: Partial<Cliente>): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    buildCliente({ ...overrides, nombre: `Cliente Test ${String(i).padStart(4, '0')}` })
  )
}

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Test Wrapper ─────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, Wrapper }
}

// ─── Component Under Test ─────────────────────────────────────────────────────

// NOTE: ClienteListPanel does not exist yet — these tests are RED phase.
// Once the component is implemented at:
//   frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx
// the import below will resolve and tests should turn GREEN.
// @ts-expect-error — Module does not exist yet (RED phase — TDD)
import ClienteListPanel from './ClienteListPanel'

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05: Real-Time Filter < 1 Second with 500 Records
// AC2 — When user types in search field, list filters in real time under 1s
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-05 — Real-time filter by nombre/NIT under 1000ms (500 records)', () => {
  it('should filter list by nombre in under 1000ms with 500 records', async () => {
    // GIVEN: MSW returns 500 client records (intercept BEFORE render)
    const clients = buildClientes(499)
    const targetCliente = buildCliente({ nombre: 'Target Empresa Buscada', nit: 'NIT-TARGET-01' })
    const allClients = [...clients, targetCliente]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json(allClients)
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel is rendered and 500 records are visible
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // Wait for list to load (skeleton disappears)
    await waitFor(() => {
      expect(screen.queryByTestId('client-list-skeleton')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // WHEN: User types "Target Empresa" in the search field
    const searchInput = screen.getByTestId('search-input')
    const t0 = performance.now()
    fireEvent.change(searchInput, { target: { value: 'Target Empresa' } })

    // THEN: Filtered results appear in under 1000ms
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items.length).toBe(1)
    }, { timeout: 1000 })

    const elapsed = performance.now() - t0
    expect(elapsed).toBeLessThan(1000)

    // AND: The matching record is visible
    expect(screen.getByText('Target Empresa Buscada')).toBeInTheDocument()
  })

  it('should filter list by NIT (case-insensitive) in under 1000ms', async () => {
    // GIVEN: MSW returns 500 client records (intercept BEFORE render)
    const clients = buildClientes(499)
    const targetCliente = buildCliente({ nombre: 'Empresa NIT Search', nit: 'NIT-UNIQUE-9999' })
    const allClients = [...clients, targetCliente]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json(allClients)
      })
    )

    const { Wrapper } = createWrapper()

    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('client-list-skeleton')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // WHEN: User types a NIT in lowercase (testing case-insensitivity)
    const searchInput = screen.getByTestId('search-input')
    const t0 = performance.now()
    fireEvent.change(searchInput, { target: { value: 'nit-unique-9999' } })

    // THEN: Filter completes in under 1000ms and shows the matching client
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items.length).toBe(1)
    }, { timeout: 1000 })

    const elapsed = performance.now() - t0
    expect(elapsed).toBeLessThan(1000)
    expect(screen.getByText('Empresa NIT Search')).toBeInTheDocument()
  })

  it('should NOT trigger additional API requests when search input changes', async () => {
    // GIVEN: MSW returns clients and tracks request count (intercept BEFORE render)
    const clients = buildClientes(5)
    let requestCount = 0

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        requestCount++
        return HttpResponse.json(clients)
      })
    )

    const { Wrapper } = createWrapper()

    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('client-list-skeleton')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    const initialRequestCount = requestCount

    // WHEN: User types 3 different search queries
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'a' } })
    fireEvent.change(searchInput, { target: { value: 'ab' } })
    fireEvent.change(searchInput, { target: { value: 'abc' } })

    // THEN: No additional API requests were made (client-side filter only)
    expect(requestCount).toBe(initialRequestCount)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06: Empty State Displayed When No Clients Exist
// AC3 — EmptyState component shown with guidance message
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-06 — EmptyState displayed when GET /clientes returns []', () => {
  it('should render EmptyState component when no clients exist', async () => {
    // GIVEN: MSW returns empty array (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel is rendered and query resolves with empty array
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: EmptyState component is rendered
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should display guidance message to create the first client in EmptyState', async () => {
    // GIVEN: MSW returns empty array (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders with no data
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: Guidance message is present (Spanish — guides user to create first client)
    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state')
      expect(emptyState).toBeInTheDocument()
      expect(
        screen.getByText(/crear.*primer cliente|no hay clientes/i)
      ).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should NOT render any cliente-list-item when list is empty', async () => {
    // GIVEN: MSW returns empty array (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders with no data
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    }, { timeout: 5000 })

    // THEN: No list items are shown
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-07: ErrorPanel with "Reintentar" on Fetch Failure + Retry Flow
// AC4 — ErrorPanel shown on backend error, retry restores client list
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-07 — ErrorPanel with "Reintentar" on fetch failure', () => {
  it('should render ErrorPanel when GET /clientes returns 500', async () => {
    // GIVEN: MSW returns HTTP 500 (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel is rendered and fetch fails
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: ErrorPanel component is rendered
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should display "Reintentar" button in ErrorPanel', async () => {
    // GIVEN: MSW returns HTTP 500 (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders with error
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: "Reintentar" button is visible in the error panel
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should call refetch() and restore list when "Reintentar" is clicked', async () => {
    // GIVEN: First call returns 500, second call returns a list of clients (intercept BEFORE render)
    const clients = [
      buildCliente({ nombre: 'Cliente Recuperado', nit: 'NIT-REC-001' }),
    ]

    let callCount = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        callCount++
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 })
        }
        return HttpResponse.json(clients)
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders and gets first error
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    }, { timeout: 5000 })

    // WHEN: User clicks "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(retryButton)

    // THEN: The client list is displayed (not the error panel)
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0)
    }, { timeout: 5000 })
  })

  it('should NOT render client list items when in error state', async () => {
    // GIVEN: MSW returns HTTP 500 (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders with error
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    }, { timeout: 5000 })

    // THEN: No list items are shown during error state
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Default sort is "Más reciente" (creation date descending)
// Story 2.1 must not break the default sort (Story 2.6 owns SortControl)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Default sort order is "Más reciente" (createdAt descending)', () => {
  it('should render clients in creation-date descending order by default', async () => {
    // GIVEN: Three clients with different createdAt dates (intercept BEFORE render)
    const oldest = buildCliente({
      nombre: 'Cliente Más Antiguo',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
    const middle = buildCliente({
      nombre: 'Cliente Intermedio',
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
    })
    const newest = buildCliente({
      nombre: 'Cliente Más Reciente',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })

    // MSW returns clients in non-sorted order (server order)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([middle, oldest, newest])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders without any user interaction
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: Default sort is "Más reciente" — newest appears first
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items.length).toBe(3)
      // First item should be the most recent (newest createdAt)
      expect(items[0]).toHaveTextContent('Cliente Más Reciente')
      // Last item should be the oldest
      expect(items[2]).toHaveTextContent('Cliente Más Antiguo')
    }, { timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable list with nombre and nit visible
// (Structural/layout assertions at component level)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — List panel renders clients with nombre and nit visible', () => {
  it('should render nombre and nit for each client item', async () => {
    // GIVEN: MSW returns a list of clients (intercept BEFORE render)
    const clients = [
      buildCliente({ nombre: 'Empresa Alpha SA', nit: 'NIT-ALPHA-001' }),
      buildCliente({ nombre: 'Beta Corp SAS', nit: 'NIT-BETA-002' }),
    ]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json(clients)
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders with clients
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: Each client item shows nombre and nit
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SA')).toBeInTheDocument()
      expect(screen.getByText('NIT-ALPHA-001')).toBeInTheDocument()
      expect(screen.getByText('Beta Corp SAS')).toBeInTheDocument()
      expect(screen.getByText('NIT-BETA-002')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should render the search input with Spanish placeholder text', async () => {
    // GIVEN: MSW returns any valid list (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([buildCliente()])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: Search input has the Spanish placeholder
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute(
        'placeholder',
        expect.stringMatching(/buscar|nombre|NIT/i)
      )
    }, { timeout: 5000 })
  })

  it('should render skeleton loading placeholders while query is loading', async () => {
    // GIVEN: MSW returns clients but with delay (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return HttpResponse.json([buildCliente()])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders (before data loads)
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: Skeleton placeholders are visible while loading (react-loading-skeleton, NOT spinner)
    await waitFor(() => {
      expect(screen.getByTestId('client-list-skeleton')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should render the list panel with correct data-testid', async () => {
    // GIVEN: MSW returns clients (intercept BEFORE render)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([buildCliente()])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: ClienteListPanel renders
    render(
      <Wrapper>
        <ClienteListPanel />
      </Wrapper>
    )

    // THEN: The panel root has the expected testid
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

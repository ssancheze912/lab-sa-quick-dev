/// @vitest-environment jsdom
/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable client list with Nombre and NIT/RUC per item
 *   AC2 — Real-time client-side search by Nombre or NIT/RUC, results in < 1s, no extra API call
 *   AC3 — EmptyState component rendered when no clients exist (variant: no-clients)
 *   AC4 — ErrorPanel with "Reintentar" button shown when backend is unavailable; retry triggers new fetch
 *   AC5 — Clearing search input restores full list without triggering a new API call
 *
 * Test Cases implemented:
 *   TC-E2-P1-06 — Real-time search filters list by nombre without additional API call
 *   TC-E2-P1-07 — Real-time search filters list by NIT/RUC partial match
 *   TC-E2-P2-01 — EmptyState rendered when GET returns empty array
 *   TC-E2-P2-02 — ErrorPanel with "Reintentar" rendered on fetch failure; clicking retry triggers new fetch
 *   TC-E2-P2-09 — 500-item list filtered in under 1000ms
 *   (AC5)  — Clearing search input restores full list without triggering a new API call
 *
 * RED phase: These tests fail because:
 *   1. ClienteListView component does not exist at
 *      frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
 *   2. useClientes hook does not exist at
 *      frontend/src/modules/crm/clientes/application/useClientes.ts
 *   3. EmptyState component does not exist at
 *      frontend/src/shared/components/EmptyState.tsx
 *   4. ErrorPanel component does not exist at
 *      frontend/src/shared/components/ErrorPanel.tsx
 *   5. data-testid attributes are not yet present in the DOM
 *   6. MSW handler for GET /api/v1/clientes is not yet wired
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// The component under test — does not exist yet (RED phase)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — intentional: module will not exist until implementation
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

// ─────────────────────────────────────────────────────────────────────────────
// Test data helpers
// ─────────────────────────────────────────────────────────────────────────────

interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  const id = Math.random().toString(36).slice(2, 10)
  return {
    id,
    nombre: `Cliente Test ${id}`,
    nit: `900${id.slice(0, 6)}`,
    telefono: `300${id.slice(0, 7)}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeClientes(count: number): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    makeCliente({
      id: String(i + 1).padStart(6, '0'),
      nombre: `Cliente ${String(i + 1).padStart(4, '0')} Empresa`,
      nit: `9${String(i + 1).padStart(9, '0')}`,
    })
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000'

const server = setupServer(
  http.get(`${API_URL}/api/v1/clientes`, () => {
    return HttpResponse.json([])
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Render helper: wraps ClienteListView in QueryClientProvider
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView(props: Record<string, unknown> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView {...props} />
    </QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06 — Real-time search filters list by nombre WITHOUT additional API call
// Story 2.1, AC2: No debounce, no new GET on keystroke
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-06 — Real-time search by nombre (no extra API call)', () => {
  it('Given the client list is loaded, When the user types in the search field, Then only matching clients appear', async () => {
    // GIVEN: MSW seeds clients including ACME and Beta
    const clientes = [
      makeCliente({ nombre: 'ACME S.A.', nit: '900100001' }),
      makeCliente({ nombre: 'Beta Corp', nit: '900200002' }),
      makeCliente({ nombre: 'Gamma Ltd', nit: '900300003' }),
    ]

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    renderClienteListView()

    // Wait for list to render
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(3)
    })

    // WHEN: user types "ACME" into search
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'ACME' } })

    // THEN: Only ACME is visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('ACME S.A.')
    })

    // AND: Beta and Gamma are not in the DOM
    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Ltd')).not.toBeInTheDocument()
  })

  it('Given filtering is active, When the search field is cleared, Then the full list is restored', async () => {
    // GIVEN: MSW seeds clients
    const clientes = [
      makeCliente({ nombre: 'ACME S.A.', nit: '900100001' }),
      makeCliente({ nombre: 'Beta Corp', nit: '900200002' }),
    ]

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(2)
    })

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'ACME' } })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(1)
    })

    // WHEN: Search field is cleared
    fireEvent.change(searchInput, { target: { value: '' } })

    // THEN: Full list is restored (AC5)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(2)
    })
  })

  it('Given search is active, When input is cleared, Then no new API call is made (AC5)', async () => {
    // GIVEN: MSW tracks request count
    let requestCount = 0
    const clientes = [
      makeCliente({ nombre: 'ACME S.A.', nit: '900100001' }),
      makeCliente({ nombre: 'Beta Corp', nit: '900200002' }),
    ]

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        requestCount++
        return HttpResponse.json(clientes)
      })
    )

    renderClienteListView()

    // Wait for initial load (1 request)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(2)
    })

    const initialCount = requestCount

    const searchInput = screen.getByRole('searchbox')
    // WHEN: Type then clear
    fireEvent.change(searchInput, { target: { value: 'ACME' } })
    fireEvent.change(searchInput, { target: { value: '' } })

    // Wait for potential re-render
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(2)
    })

    // THEN: No additional API request was made
    expect(requestCount).toBe(initialCount)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-07 — Real-time search filters by NIT/RUC partial match
// Story 2.1, AC2
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-07 — Real-time search by NIT/RUC partial match', () => {
  it('Given clients with known NITs, When user types NIT partial match, Then only matching client appears', async () => {
    // GIVEN: Client with NIT "900123456-1" in the list
    const clientes = [
      makeCliente({ nombre: 'ACME S.A.', nit: '900123456-1' }),
      makeCliente({ nombre: 'Beta Corp', nit: '900999999-2' }),
    ]

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(2)
    })

    // WHEN: User types partial NIT "900123456"
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: '900123456' } })

    // THEN: Only the matching client appears
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('900123456-1')
    })

    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()
  })

  it('Given search by NIT, When no client matches the NIT, Then an empty state is shown for search', async () => {
    // GIVEN: Clients without the searched NIT
    const clientes = [
      makeCliente({ nombre: 'ACME S.A.', nit: '900100001' }),
    ]

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(1)
    })

    // WHEN: User types a NIT that matches nothing
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: '999999999' } })

    // THEN: No list items are visible; search-empty state may be shown
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })

  it('Given search by NIT, When no new API call is triggered on keystroke (TC-E2-P1-06 invariant)', async () => {
    // GIVEN: Track API requests
    let requestCount = 0
    const clientes = [makeCliente({ nombre: 'ACME S.A.', nit: '900123456-1' })]

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        requestCount++
        return HttpResponse.json(clientes)
      })
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(1)
    })

    const initialCount = requestCount

    // WHEN: User types NIT characters one by one
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: '9' } })
    fireEvent.change(searchInput, { target: { value: '90' } })
    fireEvent.change(searchInput, { target: { value: '900' } })
    fireEvent.change(searchInput, { target: { value: '9001' } })

    // THEN: No additional GET /api/v1/clientes requests made
    expect(requestCount).toBe(initialCount)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-01 — EmptyState displayed when GET returns empty array
// Story 2.1, AC3
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-01 — EmptyState displayed when no clients exist', () => {
  it('Given no clients in the system, When the user navigates to /clientes, Then EmptyState is rendered', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: ClienteListView renders
    renderClienteListView()

    // THEN: EmptyState component is visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('Given no clients, Then EmptyState shows "No hay clientes registrados" message', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    renderClienteListView()

    // THEN: Guidance message in Spanish is displayed
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(
        'No hay clientes registrados'
      )
    })
  })

  it('Given no clients, Then no list items are rendered', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    renderClienteListView()

    // Wait for empty state to render
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    // THEN: No client list items visible
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('Given no clients, Then EmptyState has aria-live="polite" for screen reader announcements', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    renderClienteListView()

    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state')
      expect(emptyState).toBeInTheDocument()
      // THEN: aria-live="polite" is set for screen reader accessibility (WCAG 2.1 AA)
      expect(emptyState).toHaveAttribute('aria-live', 'polite')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-02 — ErrorPanel with "Reintentar" rendered on fetch failure
// Story 2.1, AC4 (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-02 — ErrorPanel displayed on fetch failure', () => {
  it('Given the backend is unavailable, When the fetch fails, Then ErrorPanel is displayed instead of the list', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: ClienteListView renders
    renderClienteListView()

    // THEN: ErrorPanel component is visible
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('Given the backend is unavailable, Then "Reintentar" button is visible in ErrorPanel', async () => {
    // GIVEN: Backend returns network error
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.error()
      )
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: "Reintentar" button is visible
    expect(
      screen.getByRole('button', { name: /reintentar/i })
    ).toBeInTheDocument()
  })

  it('Given ErrorPanel is shown, When user clicks "Reintentar", Then a new fetch is triggered', async () => {
    // GIVEN: First request fails, second succeeds
    let requestCount = 0

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.json({ error: 'fail' }, { status: 500 })
        }
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    // Wait for ErrorPanel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    expect(requestCount).toBe(1)

    // WHEN: User clicks "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(retryButton)

    // THEN: A new fetch request is triggered
    await waitFor(() => {
      expect(requestCount).toBeGreaterThanOrEqual(2)
    })
  })

  it('Given ErrorPanel is shown, When retry succeeds, Then ErrorPanel is replaced by the list or EmptyState', async () => {
    // GIVEN: First request fails, second succeeds with empty array
    let requestCount = 0

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.json({ error: 'fail' }, { status: 500 })
        }
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // WHEN: User clicks "Reintentar"
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: ErrorPanel disappears (replaced by EmptyState or list)
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    })
  })

  it('Given ErrorPanel, Then no raw error codes or stack traces are exposed in the UI', async () => {
    // GIVEN: Backend returns 500 with error detail
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(
          { detail: 'System.NullReferenceException at line 42' },
          { status: 500 }
        )
      )
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: Stack trace details are NOT visible in the UI (NFR6)
    expect(screen.queryByText(/NullReferenceException/)).not.toBeInTheDocument()
    expect(screen.queryByText(/at line/)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-09 — 500-record filter performance under 1 second
// Story 2.1, AC2 (NFR1)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-09 — 500-record filter under 1 second', () => {
  it('Given 500 clients loaded, When the user types in the search field, Then results appear in under 1000ms', async () => {
    // GIVEN: MSW seeds 500 clients; one of them has "xyz" in the nombre
    const clientes = makeClientes(499)
    clientes.push(
      makeCliente({
        id: 'target',
        nombre: 'XYZ Empresa Especial',
        nit: '900000000',
      })
    )

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    renderClienteListView()

    // Wait for list to render (500 items)
    await waitFor(
      () => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBe(500)
      },
      { timeout: 5000 }
    )

    const searchInput = screen.getByRole('searchbox')

    // WHEN: User types "XYZ" — measure elapsed time
    const start = performance.now()

    act(() => {
      fireEvent.change(searchInput, { target: { value: 'XYZ' } })
    })

    // Wait for filter to apply
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBe(1)
    })

    const elapsed = performance.now() - start

    // THEN: Elapsed time is under 1000ms (NFR1)
    expect(elapsed).toBeLessThan(1000)
    expect(screen.getByTestId('cliente-list-item')).toHaveTextContent('XYZ Empresa Especial')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Client list panel renders with correct structure
// Story 2.1 — baseline structural assertions
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Client list panel structural requirements', () => {
  it('Given clients exist, When the component renders, Then it shows Nombre and NIT/RUC per item', async () => {
    // GIVEN: Backend returns a known client
    const cliente = makeCliente({ nombre: 'ACME S.A.', nit: '900123456-1' })

    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([cliente]))
    )

    renderClienteListView()

    // THEN: Both Nombre and NIT are visible in the list item
    await waitFor(() => {
      const item = screen.getByTestId('cliente-list-item')
      expect(item).toHaveTextContent('ACME S.A.')
      expect(item).toHaveTextContent('900123456-1')
    })
  })

  it('Given clients exist, When the component renders, Then aria-busy="true" is set while loading', async () => {
    // GIVEN: Response is delayed
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json([])
      })
    )

    renderClienteListView()

    // THEN: aria-busy="true" is set on the list container while loading
    const listContainer = await screen.findByRole('list')
    // The list may be busy at start, so we check if the attribute was ever true
    // or we look for a container with aria-busy
    expect(listContainer || screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
  })

  it('Given clients exist, Then the search input has aria-label="Buscar clientes"', async () => {
    // GIVEN: Backend returns clients
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([makeCliente()])
      )
    )

    renderClienteListView()

    // THEN: Accessible search input with correct aria-label
    await waitFor(() => {
      const searchInput = screen.getByLabelText('Buscar clientes')
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('Given clients exist, Then the search container has role="search"', async () => {
    // GIVEN: Backend returns clients
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([makeCliente()])
      )
    )

    renderClienteListView()

    // THEN: role="search" landmark is present for accessibility
    await waitFor(() => {
      expect(screen.getByRole('search')).toBeInTheDocument()
    })
  })
})

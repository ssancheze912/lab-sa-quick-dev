/**
 * ATDD Component Tests — Story 2.1: Client List & Search
 *
 * RED Phase: These tests fail until ClienteListView is implemented.
 *
 * Covers:
 *   AC1 — TC-E2-P1-04: Client list renders with Nombre and NIT per item
 *   AC2 — TC-E2-P1-05: Real-time search filter by Nombre and NIT (no extra fetch)
 *   AC3 — TC-E2-P1-06: EmptyState displayed when no clients exist
 *   AC4 — TC-E2-P1-07: ErrorPanel with "Reintentar" on fetch failure; retry triggers refetch
 *
 * Pattern: Vitest + @testing-library/react + MSW
 * Network-first: MSW handlers are set up before render (intercept-before-navigate)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteListView } from '../ClienteListView'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries so error state resolves fast in tests
        retry: false,
        staleTime: 0,
      },
    },
  })
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  }
}

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const API_URL = 'http://localhost:5000'

const twoClientes = [
  {
    id: 'aaa00000-0000-0000-0000-000000000001',
    nombre: 'Empresa Alpha',
    nit: '111000111-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'bbb00000-0000-0000-0000-000000000002',
    nombre: 'Beta Corp',
    nit: '222333444-2',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
  },
]

const threeClientes = [
  {
    id: 'aaa00000-0000-0000-0000-000000000001',
    nombre: 'Empresa Alpha',
    nit: '111000111-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'bbb00000-0000-0000-0000-000000000002',
    nombre: 'Beta Corp',
    nit: '222333444-2',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'ccc00000-0000-0000-0000-000000000003',
    nombre: 'Gamma SA',
    nit: '333444555-3',
    telefono: '3003333333',
    ciudad: 'Cali',
    createdAt: '2026-05-03T10:00:00Z',
    updatedAt: '2026-05-03T10:00:00Z',
  },
]

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// TC-E2-P1-04: Client list renders with Nombre and NIT per item
// AC1 — Given there are clients, When user navigates to /clientes,
//        Then the left panel shows a scrollable list with Nombre and NIT per item
// ---------------------------------------------------------------------------

describe('TC-E2-P1-04 — Client list renders with Nombre and NIT per item', () => {
  it('Given GET /api/v1/clientes returns 2 clients, When ClienteListView renders, Then both Nombre values are visible', async () => {
    // GIVEN: Network intercepted before render — MSW returns 2 clients
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderWithQuery(<ClienteListView />)

    // THEN: Both client nombres are visible
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
      expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    })
  })

  it('Given GET /api/v1/clientes returns 2 clients, When ClienteListView renders, Then both NIT values are visible', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderWithQuery(<ClienteListView />)

    // THEN: Both NIT values are visible
    await waitFor(() => {
      expect(screen.getByText('111000111-1')).toBeInTheDocument()
      expect(screen.getByText('222333444-2')).toBeInTheDocument()
    })
  })

  it('Given GET /api/v1/clientes returns 2 clients, When ClienteListView renders, Then left panel has data-testid="cliente-list-panel"', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderWithQuery(<ClienteListView />)

    // THEN: Panel container is present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-panel')).toBeInTheDocument()
    })
  })

  it('Given data is loaded, When ClienteListView renders, Then loading skeleton is no longer shown', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered and data resolves
    renderWithQuery(<ClienteListView />)

    // THEN: No loading skeleton after data resolves
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-list-skeleton')).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-05: Real-time search filter by Nombre and NIT (no additional fetch)
// AC2 — Given the list is loaded, When user types in the search field,
//        Then the list filters in real time (client-side, no additional API call)
// ---------------------------------------------------------------------------

describe('TC-E2-P1-05 — Real-time search filter by Nombre and NIT', () => {
  it('Given 3 clients loaded, When user types "Alpha" in the search field, Then only "Empresa Alpha" is visible', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(threeClientes, { status: 200 })
      )
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteListView />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // WHEN: User types "Alpha" in the search field
    const searchInput = screen.getByPlaceholderText('Buscar cliente...')
    await user.type(searchInput, 'Alpha')

    // THEN: Only "Empresa Alpha" is visible
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma SA')).not.toBeInTheDocument()
  })

  it('Given 3 clients loaded, When user types "222" in the search field, Then only "Beta Corp" (NIT 222...) is visible', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(threeClientes, { status: 200 })
      )
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteListView />)

    await waitFor(() => {
      expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    })

    // WHEN: User types "222" (matches Beta Corp NIT)
    const searchInput = screen.getByPlaceholderText('Buscar cliente...')
    await user.type(searchInput, '222')

    // THEN: Only "Beta Corp" is visible
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma SA')).not.toBeInTheDocument()
  })

  it('Given 3 clients loaded and search is active, When user clears the search field, Then all clients are visible again', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(threeClientes, { status: 200 })
      )
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteListView />)

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar cliente...')
    await user.type(searchInput, 'Alpha')

    // Verify filtered state
    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()

    // WHEN: User clears the input
    await user.clear(searchInput)

    // THEN: All clients visible again
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    expect(screen.getByText('Gamma SA')).toBeInTheDocument()
  })

  it('Given 3 clients loaded, When user types in the search field, Then no additional fetch to /api/v1/clientes is triggered', async () => {
    // GIVEN: Track fetch call count with MSW
    let fetchCount = 0
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        fetchCount++
        return HttpResponse.json(threeClientes, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteListView />)

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // Reset count after initial load
    fetchCount = 0

    // WHEN: User types in the search field
    const searchInput = screen.getByPlaceholderText('Buscar cliente...')
    await user.type(searchInput, 'Alpha')
    await user.type(searchInput, 'bet')

    // THEN: No additional fetch was triggered (filtering is client-side)
    expect(fetchCount).toBe(0)
  })

  it('Given search is case-sensitive concern, When user types "alpha" (lowercase), Then "Empresa Alpha" is still visible (case-insensitive)', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(threeClientes, { status: 200 })
      )
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteListView />)

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // WHEN: User types lowercase "alpha"
    const searchInput = screen.getByPlaceholderText('Buscar cliente...')
    await user.type(searchInput, 'alpha')

    // THEN: Case-insensitive match works
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-06: EmptyState displayed when no clients exist
// AC3 — Given no clients in the system, When user navigates to /clientes,
//        Then EmptyState component is displayed with Spanish guidance
// ---------------------------------------------------------------------------

describe('TC-E2-P1-06 — EmptyState displayed when no clients exist', () => {
  it('Given GET /api/v1/clientes returns empty array, When ClienteListView renders, Then EmptyState is rendered', async () => {
    // GIVEN: Network intercepted before render — returns empty list
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderWithQuery(<ClienteListView />)

    // THEN: EmptyState component is rendered
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('Given no clients, When ClienteListView renders, Then EmptyState contains Spanish guidance message', async () => {
    // GIVEN: Network intercepted before render — returns empty list
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderWithQuery(<ClienteListView />)

    // THEN: Spanish guidance message is visible
    await waitFor(() => {
      expect(
        screen.getByText('No hay clientes aún. Crea el primero.')
      ).toBeInTheDocument()
    })
  })

  it('Given no clients, When ClienteListView renders, Then no client list items are rendered', async () => {
    // GIVEN: Network intercepted before render — returns empty list
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    // WHEN: ClienteListView is rendered
    renderWithQuery(<ClienteListView />)

    // THEN: No list items in the DOM
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-07: ErrorPanel with "Reintentar" on fetch failure; retry triggers refetch
// AC4 — Given backend unavailable, When fetch fails,
//        Then ErrorPanel with "Reintentar" button is shown; clicking triggers new fetch
// ---------------------------------------------------------------------------

describe('TC-E2-P1-07 — ErrorPanel with "Reintentar" on fetch failure', () => {
  it('Given GET /api/v1/clientes returns network error, When ClienteListView renders, Then ErrorPanel is displayed', async () => {
    // GIVEN: Network intercepted before render — simulates network error
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.error()
      )
    )

    // WHEN: ClienteListView is rendered and query fails
    renderWithQuery(<ClienteListView />)

    // THEN: ErrorPanel is displayed
    await waitFor(
      () => {
        expect(screen.getByTestId('error-panel')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('Given fetch fails, When ErrorPanel is shown, Then "Reintentar" button is visible', async () => {
    // GIVEN: Network intercepted before render — simulates failure
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.error()
      )
    )

    renderWithQuery(<ClienteListView />)

    // THEN: "Reintentar" button is present in ErrorPanel
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: 'Reintentar' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('Given ErrorPanel is shown, When user clicks "Reintentar" and backend recovers, Then client list renders', async () => {
    // GIVEN: First request fails, then succeeds after retry
    let requestCount = 0
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(twoClientes, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteListView />)

    // Wait for ErrorPanel to appear
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // WHEN: User clicks "Reintentar"
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: Client list renders after successful retry
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
  })

  it('Given fetch fails, When ErrorPanel is shown, Then error message is in Spanish', async () => {
    // GIVEN: Network intercepted before render — simulates failure
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.error()
      )
    )

    renderWithQuery(<ClienteListView />)

    // THEN: Spanish error message is visible
    await waitFor(
      () => {
        expect(
          screen.getByText('No se pudo cargar la lista de clientes.')
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})

// ---------------------------------------------------------------------------
// Loading state skeleton tests (implicit in AC1)
// ---------------------------------------------------------------------------

describe('Loading state — skeleton placeholders shown during fetch', () => {
  it('Given ClienteListView is mounted, When fetch is in-flight, Then skeleton placeholders are rendered', async () => {
    // GIVEN: Network intercepted — delayed response
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, async () => {
        // Slight delay to keep loading state visible
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json(twoClientes, { status: 200 })
      })
    )

    // WHEN: ClienteListView is rendered (before data resolves)
    renderWithQuery(<ClienteListView />)

    // THEN: Skeleton placeholder is visible
    expect(screen.getByTestId('cliente-list-skeleton')).toBeInTheDocument()
  })

  it('Given ClienteListView is loading, When loading skeleton renders, Then ARIA label "Cargando clientes..." is present', async () => {
    // GIVEN: Delayed response keeps loading state
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json(twoClientes, { status: 200 })
      })
    )

    // WHEN: Rendered
    renderWithQuery(<ClienteListView />)

    // THEN: ARIA label is present for accessibility
    expect(
      screen.getByLabelText('Cargando clientes...')
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Search field accessibility
// ---------------------------------------------------------------------------

describe('Search field — ARIA accessibility', () => {
  it('Given ClienteListView is rendered, When data loads, Then search field has aria-label "Buscar clientes"', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    renderWithQuery(<ClienteListView />)

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })

    // THEN: Search input has proper ARIA label
    expect(
      screen.getByRole('searchbox', { name: 'Buscar clientes' })
    ).toBeInTheDocument()
  })
})

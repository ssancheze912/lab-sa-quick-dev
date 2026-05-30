// Story 2.1: Client List & Search
// ATDD Component Tests — ClienteListView
// Status: RED — Tests fail until ClienteListView, EmptyState, ErrorPanel are implemented
// AC covered: AC#1 (list view), AC#2 (real-time filter), AC#3 (EmptyState), AC#4 (ErrorPanel + retry)
// Test cases: TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-10

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteListView } from './ClienteListView'
import {
  mockClientes,
  clientesEmptyHandlers,
  clientesErrorHandlers,
} from '../../../../__mocks__/handlers/clientes'

// ---------------------------------------------------------------------------
// MSW server setup — network-first interception before any navigation
// ---------------------------------------------------------------------------
const server = setupServer(
  http.get('/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Helper: Creates a fresh QueryClient per test (no cache bleed between tests)
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries so error tests fail immediately
        gcTime: 0,
      },
    },
  })
}

function renderClienteListView() {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// TC-E2-P1-07: Client List Filters in Real-Time by Nombre (client-side)
// AC#2: "filters in real time showing only clients whose Nombre match"
// AC#2: "No additional API call made for search (client-side only)"
// ---------------------------------------------------------------------------
describe('ClienteListView — TC-E2-P1-07: real-time filter by Nombre', () => {
  it('Given two clients When typing "ana" in search Then only "Ana García" is visible and "Pedro Pérez" is hidden', async () => {
    // Given — MSW returns [Ana García, Pedro Pérez]
    const user = userEvent.setup()
    renderClienteListView()

    // Wait for the list to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).toBeInTheDocument()
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')).toBeInTheDocument()
    })

    // When — user types "ana" in the search field
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'ana')

    // Then — only Ana García visible; Pedro Pérez hidden
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).toBeInTheDocument()
      expect(screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')).not.toBeInTheDocument()
    })
  })

  it('Given two clients When typing "ana" in search Then no additional API call is made (client-side filter only)', async () => {
    // Given
    let apiCallCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        apiCallCount++
        return HttpResponse.json(mockClientes)
      })
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).toBeInTheDocument()
    })

    const callsAfterLoad = apiCallCount

    // When
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'ana')

    // Then — API called exactly once on mount, no additional calls for search
    expect(apiCallCount).toBe(callsAfterLoad)
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-08: Client List Filters in Real-Time by NIT/RUC (client-side)
// AC#2: "filters in real time showing only clients whose NIT/RUC match"
// ---------------------------------------------------------------------------
describe('ClienteListView — TC-E2-P1-08: real-time filter by NIT', () => {
  it('Given two clients with different NITs When typing partial NIT of first client Then only first client is visible', async () => {
    // Given — mockClientes has NIT '900-111-001' and '800-222-002'
    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).toBeInTheDocument()
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')).toBeInTheDocument()
    })

    // When — search by partial NIT of Ana García ('900')
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, '900')

    // Then — only client with NIT '900-111-001' visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).toBeInTheDocument()
      expect(screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')).not.toBeInTheDocument()
    })
  })

  it('Given two clients When typing partial NIT of second client Then only second client is visible', async () => {
    // Given
    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')).toBeInTheDocument()
    })

    // When — search by partial NIT of Pedro Pérez ('800')
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, '800')

    // Then
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).not.toBeInTheDocument()
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')).toBeInTheDocument()
    })
  })

  it('Given clients When typing NIT search Then no additional API fetch is triggered', async () => {
    // Given
    let apiCallCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        apiCallCount++
        return HttpResponse.json(mockClientes)
      })
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).toBeInTheDocument()
    })

    const callsAfterMount = apiCallCount

    // When
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, '900')

    // Then
    expect(apiCallCount).toBe(callsAfterMount)
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-09: EmptyState Displayed When Client List Is Empty
// AC#3: "EmptyState component is displayed with a Spanish message"
// ---------------------------------------------------------------------------
describe('ClienteListView — TC-E2-P1-09: EmptyState on empty list', () => {
  it('Given backend returns empty array When navigating to /clientes Then EmptyState component is rendered with guidance text', async () => {
    // Given — override MSW to return empty array
    server.use(...clientesEmptyHandlers)

    // When
    renderClienteListView()

    // Then — EmptyState renders with Spanish guidance text
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    // And — no client list items rendered
    expect(screen.queryByRole('button', { name: /cliente/i })).not.toBeInTheDocument()
  })

  it('Given empty list When EmptyState renders Then guidance text directs user to create first client', async () => {
    // Given
    server.use(...clientesEmptyHandlers)

    // When
    renderClienteListView()

    // Then — Spanish message visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      // The EmptyState must have a message in Spanish guiding the user to create
      const emptyState = screen.getByTestId('empty-state')
      expect(emptyState).toHaveTextContent(/cliente/i)
    })
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-10: ErrorPanel with "Reintentar" Displayed When Fetch Fails
// AC#4: "ErrorPanel with Reintentar button; clicking Reintentar calls refetch()"
// ---------------------------------------------------------------------------
describe('ClienteListView — TC-E2-P1-10: ErrorPanel + Reintentar on fetch failure', () => {
  it('Given backend is unavailable When page loads Then ErrorPanel is displayed with "Reintentar" button', async () => {
    // Given — override MSW to return network error
    server.use(...clientesErrorHandlers)

    // When
    renderClienteListView()

    // Then — ErrorPanel renders
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // And — "Reintentar" button is present
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('Given ErrorPanel is shown When clicking "Reintentar" Then a new fetch is triggered (refetch called)', async () => {
    // Given — first request fails
    let requestCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(mockClientes)
      })
    )

    const user = userEvent.setup()
    renderClienteListView()

    // Wait for ErrorPanel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    const requestsAfterError = requestCount

    // When — click "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    await user.click(retryButton)

    // Then — a new API request is triggered (refetch called)
    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(requestsAfterError)
    })
  })

  it('Given fetch fails When ErrorPanel renders Then no client list items are visible', async () => {
    // Given
    server.use(...clientesErrorHandlers)

    // When
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // Then
    expect(screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')).not.toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AC#1: Loading state shows skeleton (not spinner per company standard)
// ---------------------------------------------------------------------------
describe('ClienteListView — loading state renders skeleton placeholders', () => {
  it('Given fetch is in progress When component renders Then skeleton placeholder is shown (not a spinner)', () => {
    // Given — MSW responds slowly (request remains pending)
    server.use(
      http.get('/api/v1/clientes', async () => {
        // Delay response to keep component in loading state
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(mockClientes)
      })
    )

    // When
    renderClienteListView()

    // Then — skeleton is shown immediately while loading
    expect(screen.getByTestId('cliente-list-skeleton')).toBeInTheDocument()
    // And — no spinner (company standard requires skeleton, not spinner)
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
  })
})

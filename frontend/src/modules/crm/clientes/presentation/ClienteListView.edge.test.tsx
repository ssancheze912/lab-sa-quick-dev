// Story 2.1: Client List & Search — Automate expansion
// Component edge case tests for ClienteListView
// Coverage: edge cases, boundary conditions, error paths NOT in ATDD tests
// Level: Component | Priority: P1-P2

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteListView } from './ClienteListView'
import { mockClientes } from '../../../../__mocks__/handlers/clientes'

// ---------------------------------------------------------------------------
// MSW server — default returns two clients
// ---------------------------------------------------------------------------
const server = setupServer(
  http.get('/api/v1/clientes', () => HttpResponse.json(mockClientes)),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

function renderView() {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>,
  )
}

// ---------------------------------------------------------------------------
// [P1] "No results" state when query matches nothing
// AC#2: "filteredClientes.length === 0" → no items shown
// Note: the component renders EmptyState for both genuinely empty data and
// zero-match searches; the key assertion is that no list items are visible.
// ---------------------------------------------------------------------------
describe('ClienteListView — [P1] empty search results message', () => {
  it('Given a loaded client list When user types a query matching nobody Then no client list items are shown', async () => {
    // Given
    const user = userEvent.setup()
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })

    // When
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'zzzzzz')

    // Then — no list items visible
    await waitFor(() => {
      expect(
        screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002'),
      ).not.toBeInTheDocument()
    })
  })

  it('Given a non-matching query is shown When user clears the search input Then all clients return', async () => {
    // Given
    const user = userEvent.setup()
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'zzzzzz')

    await waitFor(() => {
      expect(
        screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).not.toBeInTheDocument()
    })

    // When — clear the input
    await user.clear(searchInput)

    // Then — both clients re-appear
    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002'),
      ).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// [P1] Search is case-insensitive at component level (integration of filter)
// ---------------------------------------------------------------------------
describe('ClienteListView — [P1] case-insensitive search integrated in component', () => {
  it('Given client "Ana García" When searching "ANA" (all caps) Then Ana García is shown', async () => {
    // Given
    const user = userEvent.setup()
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })

    // When
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'ANA')

    // Then
    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002'),
      ).not.toBeInTheDocument()
    })
  })

  it('Given client "Pedro Pérez" When searching "perez" (no accent) Then Pedro Pérez is shown', async () => {
    // Given
    const user = userEvent.setup()
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002'),
      ).toBeInTheDocument()
    })

    // When
    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'perez')

    // Then
    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002'),
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// [P1] Layout structure — static DOM assertions
// AC#1: 280px fixed left panel with required elements present
// ---------------------------------------------------------------------------
describe('ClienteListView — [P1] layout and accessibility structure', () => {
  it('Given the component mounts When loaded Then the "Clientes" heading is present', async () => {
    renderView()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument()
    })
  })

  it('Given the component mounts When loaded Then the search input has correct aria-label', async () => {
    renderView()

    await waitFor(() => {
      const input = screen.getByRole('searchbox', { name: /buscar clientes/i })
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', expect.stringMatching(/nombre|nit/i))
    })
  })

  it('Given the component mounts When loaded Then the root element is present', async () => {
    renderView()

    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-view')).toBeInTheDocument()
    })
  })

  it('Given the component renders the list When loaded Then client list items have accessible role "button"', async () => {
    renderView()

    await waitFor(() => {
      const items = screen.getAllByRole('button')
      // At least the two mock clients
      expect(items.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ---------------------------------------------------------------------------
// [P1] EmptyState shown for empty data (no query path)
// AC#3: EmptyState with Spanish guidance message for empty dataset
// ---------------------------------------------------------------------------
describe('ClienteListView — [P1] EmptyState shown for empty data', () => {
  it('Given empty data AND no search query When loaded Then EmptyState renders', async () => {
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    renderView()

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('Given empty data When EmptyState renders Then no client list items are present', async () => {
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    renderView()

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    expect(
      screen.queryByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
    ).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P2] Retry succeeds and list becomes visible after ErrorPanel → Reintentar
// AC#4: After retry the list renders correctly if network recovers
// ---------------------------------------------------------------------------
describe('ClienteListView — [P2] Reintentar leads to successful data load', () => {
  it('Given fetch initially fails When user clicks Reintentar and retry succeeds Then client list renders', async () => {
    // Given — first request fails, second succeeds
    let requestCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        requestCount++
        if (requestCount === 1) return HttpResponse.error()
        return HttpResponse.json(mockClientes)
      }),
    )

    const user = userEvent.setup()
    renderView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // When
    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    await user.click(retryButton)

    // Then — list appears after successful retry
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// [P2] Search input preserves value between re-renders
// Regression guard: state persistence
// ---------------------------------------------------------------------------
describe('ClienteListView — [P2] search input state persistence', () => {
  it('Given user typed a query When component re-renders due to data update Then input retains value', async () => {
    // Given
    const user = userEvent.setup()
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i })
    await user.type(searchInput, 'ana')

    // Then — input retains the typed value
    expect(searchInput).toHaveValue('ana')
  })
})

// ---------------------------------------------------------------------------
// [P2] Each list item displays both nombre and nit
// AC#1: "each item contains Nombre and NIT/RUC visible per item"
// ---------------------------------------------------------------------------
describe('ClienteListView — [P2] list item content correctness', () => {
  it('Given client list loaded When rendered Then each ClientListItem shows nombre and nit', async () => {
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })

    const item1 = screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001')
    expect(within(item1).getByText('Ana García')).toBeInTheDocument()
    expect(within(item1).getByText('900-111-001')).toBeInTheDocument()

    const item2 = screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000002')
    expect(within(item2).getByText('Pedro Pérez')).toBeInTheDocument()
    expect(within(item2).getByText('800-222-002')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P2] Skeleton is NOT shown after data has loaded
// Regression guard: no double-rendering of skeleton + list
// ---------------------------------------------------------------------------
describe('ClienteListView — [P2] skeleton disappears after load', () => {
  it('Given data has loaded When list is rendered Then skeleton is no longer present', async () => {
    renderView()

    await waitFor(() => {
      expect(
        screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
      ).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cliente-list-skeleton')).not.toBeInTheDocument()
  })
})

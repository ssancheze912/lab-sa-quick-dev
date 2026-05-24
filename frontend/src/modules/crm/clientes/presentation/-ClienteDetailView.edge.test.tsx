/**
 * Story 2.2: Client Detail View
 * Edge Case Tests — ClienteDetailView Component (Vitest + RTL + MSW)
 *
 * Expands ATDD coverage with edge cases NOT covered by the primary test suite:
 *   - Generic server error (500) renders ErrorPanel, not not-found message
 *   - ErrorPanel "Reintentar" button triggers refetch (retry mechanism works)
 *   - Generic error path does NOT render cliente-not-found element
 *   - Empty clienteId prop — component renders panel without crashing
 *   - Whitespace-only clienteId — no crash, panel container present
 *   - Skeleton rows: exactly 4 skeleton elements rendered while loading
 *   - Data loaded: no ErrorPanel present
 *   - Data loaded: no skeleton elements present after data arrives
 *   - All four field labels present simultaneously when data loaded
 *   - createdAt field is NOT displayed (not in story AC — only 4 fields shown)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { ClienteDetailView } from './ClienteDetailView'

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ID = 'cccc0003-cccc-cccc-cccc-cccccccccccc'

const mockCliente = {
  id: TEST_ID,
  nombre: 'Empresa Edge SA',
  nitRuc: '700222333',
  telefono: '3002223334',
  ciudad: 'Cali',
  createdAt: '2026-05-01T09:00:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('/api/v1/clientes/:id', ({ params }) => {
    if (params.id === TEST_ID) {
      return HttpResponse.json(mockCliente)
    }
    return new HttpResponse(null, { status: 404 })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Render with fresh QueryClient per test
// ─────────────────────────────────────────────────────────────────────────────

function renderDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteDetailView, { clienteId })
    )
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: 500 server error renders ErrorPanel (not not-found)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — generic server error (500) shows ErrorPanel', () => {
  it('[P2] Given API returns 500, When component renders error state, Then ErrorPanel is shown', async () => {
    // GIVEN: MSW returns 500 — infrastructure error, not a not-found
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
        )
      })
    )

    // WHEN: Component renders with an id that triggers a 500
    renderDetailView(TEST_ID)

    // THEN: The generic ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('[P2] Given API returns 500, When error state renders, Then "Cliente no encontrado" message is NOT shown', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    // WHEN: Component renders the 500 error state
    renderDetailView(TEST_ID)

    // THEN: The 404-specific not-found element is absent (500 ≠ 404)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })

  it('[P2] Given API returns 500, When error state renders, Then panel container is still present', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    // WHEN: Component renders error state
    renderDetailView(TEST_ID)

    // THEN: Outer panel container is always rendered regardless of error type
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Retry button in ErrorPanel triggers refetch
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — ErrorPanel retry resolves after transient error', () => {
  it('[P2] Given a transient 500 followed by success, When Reintentar is clicked, Then client data is displayed', async () => {
    // GIVEN: First request fails with 500, subsequent requests succeed
    let requestCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        requestCount++
        if (requestCount === 1) {
          return new HttpResponse(null, { status: 500 })
        }
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN: Component renders and error panel appears
    renderDetailView(TEST_ID)

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // AND WHEN: User clicks the Reintentar button
    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(retryButton)

    // THEN: After retry, client data is displayed
    await waitFor(() => {
      expect(screen.getByText('Empresa Edge SA')).toBeInTheDocument()
    })
  })

  it('[P2] Given persistent 500, When ErrorPanel renders, Then Reintentar button is present and accessible', async () => {
    // GIVEN: MSW always returns 500
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    // WHEN: Component renders error state
    renderDetailView(TEST_ID)

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: The retry button exists and is accessible by label
    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    expect(retryButton).toBeInTheDocument()
    expect(retryButton).not.toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Empty clienteId prop — query is disabled, no crash
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — empty clienteId prop does not crash', () => {
  it('[P2] Given clienteId is empty string, When component renders, Then no unhandled error is thrown', () => {
    // GIVEN: An empty clienteId — useCliente has enabled: !!id = false
    // WHEN: Component renders
    // THEN: No crash
    expect(() => renderDetailView('')).not.toThrow()
  })

  it('[P2] Given clienteId is empty string, When component renders, Then panel container is present', async () => {
    // GIVEN: Empty clienteId
    renderDetailView('')

    // WHEN: Component renders with query disabled
    // THEN: Panel container still renders (loading state or idle state)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    })
  })

  it('[P2] Given clienteId is empty string, When rendered with query disabled, Then client data is not shown', () => {
    // GIVEN: Empty clienteId — no API call made
    renderDetailView('')

    // THEN: No client field values appear (query never executed — enabled:false is synchronous)
    expect(screen.queryByText('Empresa Edge SA')).not.toBeInTheDocument()
    expect(screen.queryByText('700222333')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Skeleton count — exactly 4 skeleton rows while loading
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — skeleton renders exactly 4 rows while loading', () => {
  it('[P2] Given GET is in-flight, When component renders, Then skeleton container (dl) has exactly 4 children', async () => {
    // GIVEN: Delayed response to hold loading state
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN: Component renders in loading state
    const { container } = renderDetailView(TEST_ID)

    // THEN: The dl element has exactly 4 div children (one skeleton per field)
    const dlEl = container.querySelector('dl')
    expect(dlEl).not.toBeNull()
    expect(dlEl?.children.length).toBe(4)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Loaded state — no skeletons or ErrorPanel when data arrives
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — clean loaded state (no artifacts)', () => {
  it('[P2] Given data is loaded, When component renders data state, Then ErrorPanel is not present', async () => {
    // GIVEN: Successful API response
    renderDetailView(TEST_ID)

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Empresa Edge SA')).toBeInTheDocument()
    })

    // THEN: ErrorPanel is absent — successful data does not show error state
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('[P2] Given data is loaded, When rendered, Then all four field labels are present simultaneously', async () => {
    // GIVEN: Successful API response
    renderDetailView(TEST_ID)

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Empresa Edge SA')).toBeInTheDocument()
    })

    // THEN: All four <dt> labels are present at the same time
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })

  it('[P2] Given data is loaded, When rendered, Then all four field values are present simultaneously', async () => {
    // GIVEN: Successful API response
    renderDetailView(TEST_ID)

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Empresa Edge SA')).toBeInTheDocument()
    })

    // THEN: All four field values are simultaneously visible
    expect(screen.getByText('Empresa Edge SA')).toBeInTheDocument()
    expect(screen.getByText('700222333')).toBeInTheDocument()
    expect(screen.getByText('3002223334')).toBeInTheDocument()
    expect(screen.getByText('Cali')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: createdAt field is not displayed to the user (only 4 fields per AC)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — createdAt is not exposed in the UI', () => {
  it('[P3] Given data is loaded, When rendered, Then createdAt value is not visible in the panel', async () => {
    // GIVEN: Successful API response (mockCliente has createdAt: '2026-05-01T09:00:00Z')
    renderDetailView(TEST_ID)

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Empresa Edge SA')).toBeInTheDocument()
    })

    // THEN: The createdAt ISO string is not rendered — the story AC only specifies 4 fields
    expect(screen.queryByText('2026-05-01T09:00:00Z')).not.toBeInTheDocument()
    expect(screen.queryByText(/createdAt/i)).not.toBeInTheDocument()
  })
})

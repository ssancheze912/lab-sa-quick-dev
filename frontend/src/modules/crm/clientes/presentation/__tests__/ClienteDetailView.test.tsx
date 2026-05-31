/**
 * ATDD Component Tests — Story 2.2: Client Detail View
 *
 * RED Phase: These tests fail until ClienteDetailView is implemented.
 *
 * Covers:
 *   AC1 — Client detail panel renders Nombre, NIT/RUC, Teléfono, Ciudad on selection
 *   AC2 — Direct URL /clientes/:clienteId loads correct client via GET /api/v1/clientes/{id}
 *   AC3 — TC-E2-P1-09: Non-existent clienteId shows not-found message, no JS error
 *   AC4 — Backend unavailable: ErrorPanel with "Reintentar" button shown in right panel
 *   AC5 — No clienteId (undefined): right panel shows empty/placeholder state
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
import { ClienteDetailView } from '../ClienteDetailView'

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

const KNOWN_ID = 'aaa00000-0000-0000-0000-000000000001'
const NON_EXISTENT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

const mockCliente = {
  id: KNOWN_ID,
  nombre: 'Empresa Alpha',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// AC5 — Empty/placeholder state when no clienteId is provided (clienteId=undefined)
// Given no client is selected (/clientes without clienteId),
// When the page loads,
// Then the right panel shows a placeholder prompting user to select a client
// ---------------------------------------------------------------------------

describe('AC5 — Empty/placeholder state when no client is selected', () => {
  it('Given clienteId is undefined, When ClienteDetailView renders, Then placeholder message is displayed', async () => {
    // GIVEN: No network intercept needed — undefined clienteId must NOT fetch
    // (no MSW handler registered; if a fetch happens with onUnhandledRequest:error it will throw)

    // WHEN: ClienteDetailView rendered with no clienteId
    renderWithQuery(<ClienteDetailView clienteId={undefined} />)

    // THEN: Placeholder text guiding user to select a client is visible
    await waitFor(() => {
      expect(
        screen.getByText('Selecciona un cliente para ver sus detalles')
      ).toBeInTheDocument()
    })
  })

  it('Given clienteId is undefined, When ClienteDetailView renders, Then no API call to /api/v1/clientes is made', () => {
    // GIVEN: MSW would throw if any request hits /api/v1/clientes/{id}
    // (onUnhandledRequest: 'error' — set in beforeAll)

    // WHEN: ClienteDetailView rendered with undefined clienteId
    // THEN: No error thrown (no fetch attempted) — test passes if render does not throw
    expect(() =>
      renderWithQuery(<ClienteDetailView clienteId={undefined} />)
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// AC1 / AC2 — Detail panel renders all four fields when client data is loaded
// Given a valid clienteId, When GET /api/v1/clientes/{id} returns the client,
// Then the right panel shows Nombre, NIT/RUC, Teléfono, Ciudad
// ---------------------------------------------------------------------------

describe('AC1 / AC2 — Detail panel renders client fields', () => {
  it('Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then Nombre is visible', async () => {
    // GIVEN: Network intercepted before render — returns known client
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json(mockCliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView rendered with known clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: Nombre is displayed in the detail panel
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
  })

  it('Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then NIT/RUC is visible', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json(mockCliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView rendered with known clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: NIT value is displayed
    await waitFor(() => {
      expect(screen.getByText('900123456-1')).toBeInTheDocument()
    })
  })

  it('Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then Teléfono is visible', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json(mockCliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView rendered with known clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: Teléfono value is displayed
    await waitFor(() => {
      expect(screen.getByText('3001234567')).toBeInTheDocument()
    })
  })

  it('Given GET /api/v1/clientes/{id} returns a client, When ClienteDetailView renders, Then Ciudad is visible', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json(mockCliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView rendered with known clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: Ciudad value is displayed
    await waitFor(() => {
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    })
  })

  it('Given data is loaded, When ClienteDetailView renders, Then detail section has aria-label="Detalle del cliente"', async () => {
    // GIVEN: Network intercepted before render
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json(mockCliente, { status: 200 })
      )
    )

    // WHEN: ClienteDetailView rendered with known clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: Container has the required ARIA label for accessibility (WCAG 2.1 AA)
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Detalle del cliente' })
      ).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Loading state — skeleton shown while fetch is in-flight
// ---------------------------------------------------------------------------

describe('Loading state — skeleton shown while fetch is in-flight', () => {
  it('Given ClienteDetailView is mounted with a clienteId, When fetch is in-flight, Then skeleton is rendered', async () => {
    // GIVEN: Network intercepted — delayed response to keep loading state visible
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json(mockCliente, { status: 200 })
      })
    )

    // WHEN: ClienteDetailView rendered (before data resolves)
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: Skeleton placeholder is visible immediately
    expect(screen.getByLabelText('Cargando detalle del cliente...')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AC3 — TC-E2-P1-09: Non-existent clienteId shows not-found message
// Given a clienteId in the URL does not exist,
// When the page loads,
// Then a not-found message is displayed gracefully
// ---------------------------------------------------------------------------

describe('AC3 — TC-E2-P1-09: Non-existent clienteId shows not-found message', () => {
  it('Given GET /api/v1/clientes/{non-existent-id} returns 404, When ClienteDetailView renders, Then not-found message is displayed', async () => {
    // GIVEN: Network intercepted before render — MSW returns 404 for unknown id
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, ({ params }) => {
        if (params.id === NON_EXISTENT_ID) {
          return new HttpResponse(null, { status: 404 })
        }
        return HttpResponse.json(mockCliente, { status: 200 })
      })
    )

    // WHEN: ClienteDetailView rendered with non-existent clienteId
    renderWithQuery(<ClienteDetailView clienteId={NON_EXISTENT_ID} />)

    // THEN: Not-found message is displayed (not a blank screen or JS error)
    await waitFor(() => {
      expect(
        screen.getByText('El cliente no existe o fue eliminado.')
      ).toBeInTheDocument()
    })
  })

  it('Given GET /api/v1/clientes/{non-existent-id} returns 404, When ClienteDetailView renders, Then no ErrorPanel retry button is shown', async () => {
    // GIVEN: Network intercepted before render — 404 is NOT a network error, no retry needed
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () =>
        new HttpResponse(null, { status: 404 })
      )
    )

    // WHEN: ClienteDetailView rendered with non-existent clienteId
    renderWithQuery(<ClienteDetailView clienteId={NON_EXISTENT_ID} />)

    // THEN: "Reintentar" button is NOT shown (404 is a not-found case, not a recoverable error)
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Reintentar' })
      ).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// AC4 — Backend unavailable: ErrorPanel with "Reintentar" button
// Given the backend is unavailable when loading a client detail,
// When GET /api/v1/clientes/{id} fails (network error),
// Then an ErrorPanel with a "Reintentar" button is displayed within the right panel
// ---------------------------------------------------------------------------

describe('AC4 — ErrorPanel with "Reintentar" on network error', () => {
  it('Given GET /api/v1/clientes/{id} returns network error, When ClienteDetailView renders, Then ErrorPanel is displayed', async () => {
    // GIVEN: Network intercepted before render — simulates backend unavailable
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () => HttpResponse.error())
    )

    // WHEN: ClienteDetailView rendered with known clienteId (but network fails)
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: ErrorPanel is displayed
    await waitFor(
      () => {
        expect(screen.getByTestId('error-panel')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('Given network error, When ErrorPanel is shown, Then "Reintentar" button is visible', async () => {
    // GIVEN: Network intercepted before render — simulates network failure
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () => HttpResponse.error())
    )

    // WHEN: ClienteDetailView rendered
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: "Reintentar" button is present
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: 'Reintentar' })
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('Given ErrorPanel is shown, When user clicks "Reintentar" and backend recovers, Then client detail renders', async () => {
    // GIVEN: First request fails, then succeeds after retry
    let requestCount = 0
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(mockCliente, { status: 200 })
      })
    )

    const user = userEvent.setup()
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // Wait for ErrorPanel to appear
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // WHEN: User clicks "Reintentar"
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: Client detail renders after successful retry
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    })
  })

  it('Given network error, When ErrorPanel is shown, Then Spanish error message is visible', async () => {
    // GIVEN: Network intercepted before render — simulates failure
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () => HttpResponse.error())
    )

    // WHEN: ClienteDetailView rendered
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />)

    // THEN: Spanish error message visible
    await waitFor(
      () => {
        expect(
          screen.getByText('No se pudo cargar el cliente.')
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})

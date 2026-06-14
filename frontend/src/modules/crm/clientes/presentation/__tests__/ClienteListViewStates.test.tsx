/**
 * Story 2.1: Client List & Search — ClienteListView State Tests
 *
 * Extracted from ClienteListView.test.tsx to keep each file under 300 lines.
 * Covers empty state (AC#4) and error state with retry (AC#5).
 *
 * Acceptance Criteria covered:
 *   AC#4 — EmptyState shown when API returns []
 *   AC#5 — ErrorPanel with "Reintentar" shown when fetch fails
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P2-01: EmptyState on empty list (AC#4)
 *   TC-E2-P2-02: ErrorPanel + Reintentar refetch (AC#5)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ClienteListView } from '../ClienteListView'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

const noop = () => {}

// ─── AC#4: EmptyState When API Returns [] ────────────────────────────────────

describe('ClienteListView — AC#4: EmptyState on empty list (TC-E2-P2-01)', () => {
  it('should render EmptyState component when API returns empty array', async () => {
    // GIVEN: MSW returns [] (no clients)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: component is rendered
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: EmptyState component is rendered with the correct message
    await waitFor(() => {
      expect(
        screen.getByText('No hay clientes registrados. Crea el primero.')
      ).toBeInTheDocument()
    })
  })

  it('should NOT render list items when API returns empty array (AC#4)', async () => {
    // GIVEN: MSW returns []
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: component renders
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: no list items rendered (no role="option" elements)
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })

  it('should NOT show skeleton when API returns empty array (AC#4)', async () => {
    // GIVEN: MSW returns [] (data has arrived, just empty)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: component renders and data resolves
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(
        screen.getByText('No hay clientes registrados. Crea el primero.')
      ).toBeInTheDocument()
    })

    // THEN: skeleton is NOT visible
    expect(screen.queryByTestId('clientes-list-skeleton')).not.toBeInTheDocument()
  })
})

// ─── AC#5: ErrorPanel with Reintentar Button ──────────────────────────────────

describe('ClienteListView — AC#5: ErrorPanel on fetch failure (TC-E2-P2-02)', () => {
  it('should render ErrorPanel when backend is unavailable (AC#5)', async () => {
    // GIVEN: MSW simulates backend error
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: component renders and fetch fails
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: ErrorPanel renders with the expected message
    await waitFor(() => {
      expect(
        screen.getByText('Error al cargar los clientes.')
      ).toBeInTheDocument()
    })
  })

  it('should render a "Reintentar" button in ErrorPanel (AC#5)', async () => {
    // GIVEN: MSW returns 500 error
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: component renders
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: "Reintentar" button is visible
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Reintentar' })
      ).toBeInTheDocument()
    })
  })

  it('should trigger refetch when "Reintentar" button is clicked (AC#5 / TC-E2-P2-02)', async () => {
    // GIVEN: first request fails; second request succeeds
    let requestCount = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        requestCount++
        if (requestCount === 1) {
          return HttpResponse.json({ error: 'Server Error' }, { status: 500 })
        }
        return HttpResponse.json([
          createCliente({ nombre: 'Cliente Recuperado', nit: '900999888-1' }),
        ])
      })
    )

    const user = userEvent.setup()

    // WHEN: component renders (first fetch fails)
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los clientes.')).toBeInTheDocument()
    })

    // AND: user clicks "Reintentar"
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: list renders successfully (second fetch succeeded)
    await waitFor(() => {
      expect(screen.getByText('Cliente Recuperado')).toBeInTheDocument()
    })

    // AND: ErrorPanel is no longer visible
    expect(screen.queryByText('Error al cargar los clientes.')).not.toBeInTheDocument()
  })
})

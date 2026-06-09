/**
 * Story 2.2: Client Detail View
 * TC-E2-P1-06: Split-panel click → detail panel shows all 4 fields + URL updates
 * TC-E2-P1-08: Not-found message for invalid clienteId; left panel still visible
 * TC-E2-P2-02-fe: Skeleton during load → 4 fields visible after data loads
 *
 * RED PHASE: These tests are intentionally written to FAIL until the components
 * described in story 2-2-client-detail-view.md are implemented:
 *   - ClienteDetailView.tsx
 *   - useCliente.ts
 *   - clientes.$clienteId.tsx route (split panel)
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking a client item shows the right panel with all 4 fields + URL updates
 *   AC#2 — Direct URL /clientes/:clienteId loads the correct client details
 *   AC#3 — Invalid clienteId shows a not-found message; client list panel remains visible
 *
 * Testing stack: Vitest + React Testing Library + MSW
 * All user-facing text assertions use Spanish strings (mandatory per story).
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// MSW Server
// ---------------------------------------------------------------------------

const mockCliente: Cliente = {
  id: 'uuid-detail-1',
  nombre: 'Acme',
  nit: '900-1',
  telefono: '3001111111',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    const { id } = params
    if (id === 'uuid-detail-1') {
      return HttpResponse.json(mockCliente)
    }
    return HttpResponse.json(
      {
        status: 404,
        title: 'Cliente no encontrado.',
        detail: `Cliente con id '${id}' no encontrado.`,
      },
      { status: 404 },
    )
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderClienteDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ClienteDetailView, { clienteId }),
    ),
  )
  return queryClient
}

// ---------------------------------------------------------------------------
// TC-E2-P2-02-fe: Skeleton during loading → all 4 fields after data loads
// ---------------------------------------------------------------------------

describe('ClienteDetailView — loading and loaded states', () => {
  test('shows skeleton screen while data is loading (not a spinner)', async () => {
    // GIVEN: ClienteDetailView is rendered with a valid clienteId
    //        but the response has not yet arrived
    renderClienteDetailView('uuid-detail-1')

    // WHEN: Component first renders (isLoading === true)
    // THEN: A skeleton container is shown (not a spinner), no field labels visible yet
    // The skeleton is rendered by react-loading-skeleton with data-testid="cliente-detail-skeleton"
    // or detected by aria / role; we check that field labels are absent during load
    // This test fails until ClienteDetailView renders react-loading-skeleton on isLoading
    expect(screen.queryByText('Nombre:')).not.toBeInTheDocument()
    // The data-testid for the skeleton must be present during loading
    expect(document.querySelector('[data-testid="cliente-detail-skeleton"]')).toBeTruthy()
  })

  test('shows "Nombre:" label and value after data loads', async () => {
    // GIVEN: ClienteDetailView is rendered with clienteId="uuid-detail-1"
    renderClienteDetailView('uuid-detail-1')

    // WHEN: The API responds with the ClienteDto
    // THEN: The "Nombre:" label and the value "Acme" are visible
    await waitFor(() => {
      expect(screen.getByText('Nombre:')).toBeInTheDocument()
    })
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  test('shows "NIT/RUC:" label and value after data loads', async () => {
    // GIVEN: ClienteDetailView is rendered with clienteId="uuid-detail-1"
    renderClienteDetailView('uuid-detail-1')

    // WHEN: The API responds with the ClienteDto
    // THEN: The "NIT/RUC:" label and the value "900-1" are visible
    await waitFor(() => {
      expect(screen.getByText('NIT/RUC:')).toBeInTheDocument()
    })
    expect(screen.getByText('900-1')).toBeInTheDocument()
  })

  test('shows "Teléfono:" label and value after data loads', async () => {
    // GIVEN: ClienteDetailView is rendered with clienteId="uuid-detail-1"
    renderClienteDetailView('uuid-detail-1')

    // WHEN: The API responds with the ClienteDto
    // THEN: The "Teléfono:" label and the phone value are visible
    await waitFor(() => {
      expect(screen.getByText('Teléfono:')).toBeInTheDocument()
    })
    expect(screen.getByText('3001111111')).toBeInTheDocument()
  })

  test('shows "Ciudad:" label and value after data loads', async () => {
    // GIVEN: ClienteDetailView is rendered with clienteId="uuid-detail-1"
    renderClienteDetailView('uuid-detail-1')

    // WHEN: The API responds with the ClienteDto
    // THEN: The "Ciudad:" label and the city value are visible
    await waitFor(() => {
      expect(screen.getByText('Ciudad:')).toBeInTheDocument()
    })
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  test('renders the detail panel container with data-testid="clientes-detail-panel"', async () => {
    // GIVEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView('uuid-detail-1')

    // WHEN: Data loads successfully
    await waitFor(() => {
      expect(screen.getByText('Nombre:')).toBeInTheDocument()
    })

    // THEN: The panel container has the required data-testid for E2E test stability
    expect(screen.getByTestId('clientes-detail-panel')).toBeInTheDocument()
  })

  test('each field label is accessible via dl/dt/dd or aria-label (WCAG 2.1 AA)', async () => {
    // GIVEN: ClienteDetailView is rendered and data has loaded
    renderClienteDetailView('uuid-detail-1')

    await waitFor(() => {
      expect(screen.getByText('Nombre:')).toBeInTheDocument()
    })

    // THEN: The detail panel uses semantic HTML for label/value pairs
    // Implementation must use <dl>/<dt>/<dd> or aria-label (WCAG 2.1 AA compliance)
    const panel = screen.getByTestId('clientes-detail-panel')
    // Either a <dl> element exists inside the panel, or each value has aria-label
    const hasDl = panel.querySelector('dl') !== null
    const hasAriaLabels = panel.querySelectorAll('[aria-label]').length > 0
    expect(hasDl || hasAriaLabels).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-08: Not-found message for invalid clienteId
// ---------------------------------------------------------------------------

describe('ClienteDetailView — AC#3 not-found state (TC-E2-P1-08)', () => {
  test('shows Spanish not-found message when API returns 404', async () => {
    // GIVEN: ClienteDetailView is rendered with an ID that does not exist
    renderClienteDetailView('id-que-no-existe')

    // WHEN: The API returns 404 for that ID
    // THEN: A not-found message in Spanish is displayed in the DOM
    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })
  })

  test('does NOT show raw error.message when API returns 404 (NFR6)', async () => {
    // GIVEN: ClienteDetailView is rendered with an invalid clienteId
    renderClienteDetailView('id-que-no-existe')

    // WHEN: The API returns 404
    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })

    // THEN: No raw HTTP/network error text is shown in the DOM
    expect(screen.queryByText(/Request failed with status/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/AxiosError/i)).not.toBeInTheDocument()
  })

  test('does NOT show the 4 field labels when in not-found state', async () => {
    // GIVEN: ClienteDetailView is rendered with an invalid clienteId
    renderClienteDetailView('id-que-no-existe')

    // WHEN: The 404 not-found state is rendered
    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    })

    // THEN: The data field labels are not shown (the not-found message replaces the detail panel)
    expect(screen.queryByText('Nombre:')).not.toBeInTheDocument()
    expect(screen.queryByText('NIT/RUC:')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-06: Click client item in split-panel → detail panel + URL update
// (This test suite requires the split-panel route to be rendered)
// Note: Full split-panel integration is covered in the E2E spec (client-detail-view.spec.ts).
// Here we verify the ClienteDetailView data-testid contract for the right panel.
// ---------------------------------------------------------------------------

describe('ClienteDetailView — data-testid contract for split-panel integration (TC-E2-P1-06)', () => {
  test('ClienteDetailView pre-populated with TanStack Query cache shows all 4 fields', async () => {
    // GIVEN: TanStack Query cache is pre-populated with 1 client (simulating a click from the list)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    // Pre-populate the cache with the exact queryKey shape: ['clientes', id]
    const cacheCliente: Cliente = {
      id: 'uuid-1',
      nombre: 'Acme',
      nit: '900-1',
      telefono: '3001111111',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
    }
    queryClient.setQueryData(['clientes', 'uuid-1'], cacheCliente)

    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ClienteDetailView, { clienteId: 'uuid-1' }),
      ),
    )

    // WHEN: The component renders with cache data immediately available
    // THEN: All 4 fields are visible with correct Spanish labels and values
    await waitFor(() => {
      expect(screen.getByTestId('clientes-detail-panel')).toBeInTheDocument()
    })

    expect(screen.getByText('Nombre:')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC:')).toBeInTheDocument()
    expect(screen.getByText('900-1')).toBeInTheDocument()
    expect(screen.getByText('Teléfono:')).toBeInTheDocument()
    expect(screen.getByText('3001111111')).toBeInTheDocument()
    expect(screen.getByText('Ciudad:')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  test('detail panel renders with correct data-testid="clientes-detail-panel" for E2E selector stability', async () => {
    // GIVEN: A valid clienteId is provided and data is available in cache
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(['clientes', 'uuid-1'], {
      id: 'uuid-1',
      nombre: 'Test',
      nit: '111-1',
      telefono: '3000000000',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
    } as Cliente)

    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ClienteDetailView, { clienteId: 'uuid-1' }),
      ),
    )

    // WHEN: Component renders
    await waitFor(() => {
      expect(screen.getByText('Nombre:')).toBeInTheDocument()
    })

    // THEN: data-testid="clientes-detail-panel" is present (required by E2E tests)
    expect(screen.getByTestId('clientes-detail-panel')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Non-404 error state
// ---------------------------------------------------------------------------

describe('ClienteDetailView — non-404 error state', () => {
  test('shows ErrorPanel with retry button on non-404 server error', async () => {
    // GIVEN: The API returns a 500 server error
    server.use(
      http.get('*/api/v1/clientes/server-error-id', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    renderClienteDetailView('server-error-id')

    // WHEN: The component receives a non-404 error
    // THEN: ErrorPanel with a retry button is shown (not a raw error message)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })
})

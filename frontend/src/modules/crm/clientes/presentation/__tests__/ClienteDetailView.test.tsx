/**
 * Story 2.2: Client Detail View — ClienteDetailView Component Tests
 *
 * Acceptance Criteria covered:
 *   AC#1 — Detail shows Nombre, NIT/RUC, Teléfono, Ciudad when client selected
 *   AC#2 — Placeholder shown when clienteId is null
 *   AC#4 — Not-found message when API returns 404
 *   AC#5 — Skeleton shown during loading
 *   AC#6 — Switching clients updates right panel
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-08: ClienteDetailView shows all fields
 *   TC-E2-P1-05: Deep link loads detail
 *   TC-E2-P2-03: Not-found graceful message
 *   TC-E2-P2-04: Skeleton loading state
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ClienteDetailView } from '../ClienteDetailView'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'
const CLIENT_ID_A = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const CLIENT_ID_B = '4fa85f64-5717-4562-b3fc-2c963f66afa7'

const clienteA = createCliente({
  id: CLIENT_ID_A,
  nombre: 'Empresa ABC',
  nit: '900123456-7',
  telefono: '601 234 5678',
  ciudad: 'Bogotá',
})

const clienteB = createCliente({
  id: CLIENT_ID_B,
  nombre: 'Garcia & Co',
  nit: '800654321-3',
  telefono: '602 987 6543',
  ciudad: 'Medellín',
})

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
    HttpResponse.json(clienteA)
  ),
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_B}`, () =>
    HttpResponse.json(clienteB)
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// ─── AC#2: Placeholder when no client selected ────────────────────────────────

describe('ClienteDetailView — AC#2: No selection placeholder', () => {
  it('should render placeholder message when clienteId is null', () => {
    renderWithProviders(<ClienteDetailView clienteId={null} />)

    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeInTheDocument()
  })

  it('should render placeholder with role="status" when clienteId is null (AC#2)', () => {
    renderWithProviders(<ClienteDetailView clienteId={null} />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveTextContent('Selecciona un cliente para ver sus detalles.')
  })
})

// ─── AC#5: Skeleton loading state ────────────────────────────────────────────

describe('ClienteDetailView — AC#5: Skeleton loading state (TC-E2-P2-04)', () => {
  it('should render skeleton while data is loading', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return HttpResponse.json(clienteA)
      })
    )

    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()
  })
})

// ─── AC#4: Not-found state ────────────────────────────────────────────────────

describe('ClienteDetailView — AC#4: Not-found state (TC-E2-P2-03)', () => {
  it('should render not-found message when API returns 404', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
        HttpResponse.json({ title: 'Not found', status: 404 }, { status: 404 })
      )
    )

    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })
  })

  it('should not crash on 404 — no uncaught exceptions (AC#4)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
        HttpResponse.json({ title: 'Not found', status: 404 }, { status: 404 })
      )
    )

    expect(() =>
      renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)
    ).not.toThrow()

    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })
  })
})

// ─── AC#1: Detail rendered with all fields ────────────────────────────────────

describe('ClienteDetailView — AC#1: Detail with all fields (TC-E2-P1-08)', () => {
  it('should render Nombre when client data is returned', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    })
  })

  it('should render NIT/RUC when client data is returned (AC#1)', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('900123456-7')).toBeInTheDocument()
    })
  })

  it('should render Teléfono when client data is returned (AC#1)', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('601 234 5678')).toBeInTheDocument()
    })
  })

  it('should render Ciudad when client data is returned (AC#1)', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    })
  })

  it('should render all field labels in Spanish (AC#1)', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
      expect(screen.getByText('Teléfono')).toBeInTheDocument()
      expect(screen.getByText('Ciudad')).toBeInTheDocument()
    })
  })

  it('should render detail container with data-testid="cliente-detail-view" (AC#1)', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
  })

  it('should render article with aria-label containing client name (WCAG)', async () => {
    renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(
        screen.getByRole('article', { name: /detalle del cliente empresa abc/i })
      ).toBeInTheDocument()
    })
  })
})

// ─── AC#6: Switching clients updates detail panel ────────────────────────────

describe('ClienteDetailView — AC#6: Switching clients', () => {
  it('should display new client fields when clienteId prop changes', async () => {
    const { rerender } = renderWithProviders(<ClienteDetailView clienteId={CLIENT_ID_A} />)

    await waitFor(() => {
      expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    })

    rerender(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })}
      >
        <ClienteDetailView clienteId={CLIENT_ID_B} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Garcia & Co')).toBeInTheDocument()
    })
  })
})

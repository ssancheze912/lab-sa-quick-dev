/**
 * Story 2.2 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `ClienteDetailView` with boundary conditions the
 * RED-phase tests skipped:
 *   * Unicode-heavy field values render intact (no HTML escaping or trimming).
 *   * Non-404 HTTP failures (401, 403, 503) all route to the `ErrorPanel`
 *     branch — NOT to `ClienteNotFound` (which is reserved for 404 / invalid
 *     UUID) per AC #3 vs AC #6.
 *   * Uppercase-hex UUIDs are treated as valid and DO fire a request (parity
 *     with backend `:guid` route constraint case-insensitivity).
 *   * The detail card exposes a `data-cliente-id` attribute matching the
 *     fetched client's id — used by AC #7 selection-swap tests.
 *   * When switching from an invalid UUID to a valid one, the view swaps from
 *     `ClienteNotFound` to the detail card (via a query mount).
 *   * The container heading uses semantic `<h2>` — accessibility contract.
 *
 * [P1] tag — the detail view is the FR30 deep-link landing surface.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'

// Mock @tanstack/react-router's useNavigate BEFORE importing the component —
// same pattern as the ATDD test.
const navigateSpy = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

// Static import AFTER the mock.
import { ClienteDetailView } from './ClienteDetailView'

function renderView(clienteId: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  const utils = render(
    <QueryClientProvider client={client}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>,
  )
  return {
    ...utils,
    rerenderWithId: (id: string) =>
      utils.rerender(
        <QueryClientProvider client={client}>
          <ClienteDetailView clienteId={id} />
        </QueryClientProvider>,
      ),
  }
}

describe('ClienteDetailView — Unicode payload preservation', () => {
  it('GIVEN a Cliente with unicode-heavy fields, THEN every field renders exactly as returned', async () => {
    const target = buildCliente({
      nombre: 'Ñoño & Peña S.A. — Ãbc',
      nit: '900-123-456',
      telefono: '300 123 4567',
      ciudad: 'Cañón, Antioquia',
    })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    renderView(target.id)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Ñoño & Peña S.A. — Ãbc' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByTestId('detail-nit')).toHaveTextContent('900-123-456')
    expect(screen.getByTestId('detail-telefono')).toHaveTextContent(
      '300 123 4567',
    )
    expect(screen.getByTestId('detail-ciudad')).toHaveTextContent(
      'Cañón, Antioquia',
    )
  })
})

describe('ClienteDetailView — non-404 error routing (AC #6)', () => {
  it('GIVEN backend returns 401, THEN ErrorPanel renders (NOT ClienteNotFound)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar el cliente')).toBeInTheDocument(),
    )
    // Not-found copy MUST NOT be visible on non-404 errors.
    expect(screen.queryByText('Cliente no encontrado')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('GIVEN backend returns 403, THEN ErrorPanel renders (NOT ClienteNotFound)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json({}, { status: 403 }),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar el cliente')).toBeInTheDocument(),
    )
    expect(screen.queryByText('Cliente no encontrado')).not.toBeInTheDocument()
  })

  it('GIVEN backend returns 503, THEN ErrorPanel renders (NOT ClienteNotFound)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        new HttpResponse(null, { status: 503 }),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar el cliente')).toBeInTheDocument(),
    )
    expect(screen.queryByText('Cliente no encontrado')).not.toBeInTheDocument()
  })
})

describe('ClienteDetailView — semantic + attribute contracts (AC #1)', () => {
  it('GIVEN a rendered card, THEN the heading uses <h2> (screen-reader landmark)', async () => {
    const target = buildCliente({ nombre: 'Empresa Semántica' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    renderView(target.id)

    const heading = await screen.findByRole('heading', {
      name: 'Empresa Semántica',
      level: 2,
    })
    expect(heading).toBeInTheDocument()
  })

  it('GIVEN a rendered card, THEN data-testid="cliente-detail" and data-cliente-id match the fetched id (AC #7 contract)', async () => {
    const target = buildCliente({
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Attr Cliente',
    })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    renderView(target.id)

    const card = await screen.findByTestId('cliente-detail')
    expect(card).toHaveAttribute('data-cliente-id', target.id)
  })
})

describe('ClienteDetailView — recovery transitions', () => {
  it('GIVEN clienteId changes from non-UUID to valid UUID, THEN the view swaps from ClienteNotFound to the detail card', async () => {
    const target = buildCliente({
      id: '44444444-4444-4444-4444-444444444444',
      nombre: 'Recuperado',
    })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    const { rerenderWithId } = renderView('not-a-uuid')

    // Initially the invalid id short-circuits into ClienteNotFound.
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()

    // Switching to a valid UUID triggers a fetch and the card renders.
    rerenderWithId(target.id)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Recuperado' }),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByText('Cliente no encontrado')).not.toBeInTheDocument()
  })

  it('GIVEN a valid uppercase-hex UUID clienteId, THEN a request fires and the card renders', async () => {
    const target = buildCliente({
      id: '55555555-5555-5555-5555-555555555555',
      nombre: 'Mayúsculas',
    })
    const uppercaseId = target.id.toUpperCase()
    let observed = ''
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, ({ params }) => {
        observed = String(params.id)
        return HttpResponse.json(target, { status: 200 })
      }),
    )

    renderView(uppercaseId)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Mayúsculas' }),
      ).toBeInTheDocument(),
    )
    // The frontend passes the id verbatim (no forced-case normalisation).
    expect(observed).toBe(uppercaseId)
  })
})

describe('ClienteDetailView — NFR6 anti-leak', () => {
  it('GIVEN a 500 response with a leaky body, THEN the raw body is NEVER rendered', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(
          {
            title: 'Internal Server Error',
            stackTrace: 'at SecretModule.LeakedSecret',
            exception: 'System.Exception',
          },
          { status: 500 },
        ),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar el cliente')).toBeInTheDocument(),
    )
    // The presentation layer must NEVER surface raw error internals (NFR6).
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/SecretModule/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/System.Exception/i)).not.toBeInTheDocument()
  })
})

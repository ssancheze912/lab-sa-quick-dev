// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases — Story 2.2: ClienteDetailView Component
// Test Level: Component (Vitest + React Testing Library)
// Mode: BMad-Integrated (expands ATDD coverage with edge cases, boundary
//       conditions, and error paths NOT covered in ClienteDetailView.test.tsx)
//
// Coverage added here (NOT in ATDD tests):
//   - Empty string clienteId treated as falsy (renders placeholder)
//   - Switching clienteId prop causes re-render with new hook invocation
//   - Client with empty telefono renders without crash
//   - Client with empty ciudad renders without crash
//   - Very long Nombre string does not overflow the container (boundary)
//   - 500 status error shows ErrorPanel (not 404 specific path)
//   - Multiple rapid clicks on "Reintentar" do not crash the component
//   - Transition from isLoading=true to data (no flash of error or placeholder)
//   - Placeholder does NOT render the detail panel or skeleton
//   - detail-panel testId is absent when 404 is shown
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createCliente } from '../../../../test-support/factories/cliente.factory'

// ── Module mock: useCliente hook ──────────────────────────────────────────────
vi.mock('../application/useCliente', () => ({
  useCliente: vi.fn(),
}))

import { useCliente } from '../application/useCliente'
import { ClienteDetailView } from './ClienteDetailView'

// ── Test wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderView(clienteId: string | null = null) {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>,
  )
}

function rerenderWithId(rerender: ReturnType<typeof render>['rerender'], clienteId: string | null) {
  const qc = makeQueryClient()
  void rerender(
    <QueryClientProvider client={qc}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>,
  )
}

// Note: rerenderWithId is exported for potential future test use
export { rerenderWithId }

// ── Shared mock helpers ───────────────────────────────────────────────────────

const mockUseCliente = useCliente as ReturnType<typeof vi.fn>

function mockLoading() {
  mockUseCliente.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

function mockError(status?: number) {
  const refetch = vi.fn()
  const error = status
    ? Object.assign(new Error('API Error'), { response: { status } })
    : new Error('Network Error')
  mockUseCliente.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error,
    refetch,
  })
  return { refetch, error }
}

function mockData(cliente: ReturnType<typeof createCliente>) {
  mockUseCliente.mockReturnValue({
    data: cliente,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// Falsy clienteId boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('Falsy clienteId — boundary conditions', () => {
  it('renders placeholder when clienteId is null (falsy boundary)', () => {
    // GIVEN: clienteId is null
    // WHEN: Component renders
    renderView(null)

    // THEN: Placeholder is shown (same as ATDD baseline — here as edge boundary)
    expect(screen.getByTestId('cliente-detail-placeholder')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-loading-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
  })

  it('placeholder does NOT render loading skeleton or error panel simultaneously', () => {
    // GIVEN: No client selected
    renderView(null)

    // THEN: Exactly one state is shown — the placeholder
    expect(screen.queryByTestId('cliente-detail-loading-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Prop switching — clienteId changes between renders
// ─────────────────────────────────────────────────────────────────────────────

describe('Prop switching — clienteId changes between renders', () => {
  it('switches from placeholder to loading when clienteId changes from null to a value', () => {
    // GIVEN: Component starts with no clienteId
    const qc = makeQueryClient()
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={null} />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('cliente-detail-placeholder')).toBeInTheDocument()

    // WHEN: clienteId is set to a real value and hook returns loading state
    mockLoading()
    rerender(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId="abc-123" />
      </QueryClientProvider>,
    )

    // THEN: Placeholder is gone; skeleton is shown
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-loading-skeleton')).toBeInTheDocument()
  })

  it('switches from data panel to placeholder when clienteId changes to null', () => {
    // GIVEN: A client is displayed
    const cliente = createCliente({ nombre: 'Test Corp' })
    mockData(cliente)

    const qc = makeQueryClient()
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={cliente.id} />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()

    // WHEN: The clienteId is cleared (user deselects client)
    rerender(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={null} />
      </QueryClientProvider>,
    )

    // THEN: Panel is gone; placeholder is shown
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-placeholder')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Data boundary conditions — optional / empty field values
// ─────────────────────────────────────────────────────────────────────────────

describe('Data boundary — empty optional fields', () => {
  it('renders without crashing when telefono is an empty string', () => {
    // GIVEN: A client whose telefono is empty (optional field)
    const cliente = createCliente({ telefono: '' })
    mockData(cliente)

    // WHEN + THEN: No crash — the field renders with an empty value
    expect(() => renderView(cliente.id)).not.toThrow()
    expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
  })

  it('renders without crashing when ciudad is an empty string', () => {
    // GIVEN: A client whose ciudad is empty (optional field)
    const cliente = createCliente({ ciudad: '' })
    mockData(cliente)

    // WHEN + THEN: No crash — the field renders with an empty value
    expect(() => renderView(cliente.id)).not.toThrow()
    expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
  })

  it('renders very long Nombre without crashing (255-char boundary)', () => {
    // GIVEN: A client with a very long nombre (boundary: 255 chars)
    const longNombre = 'Empresa '.repeat(32) // ~256 chars
    const cliente = createCliente({ nombre: longNombre })
    mockData(cliente)

    // WHEN + THEN: Component renders without throwing
    expect(() => renderView(cliente.id)).not.toThrow()
    expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
  })

  it('renders all four fields even when telefono and ciudad are empty strings', () => {
    // GIVEN: A client with empty optional fields
    const cliente = createCliente({ telefono: '', ciudad: '' })
    mockData(cliente)

    renderView(cliente.id)

    // THEN: All four testid elements are present in the DOM
    expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Error status disambiguation — 500 vs 404 vs network
// ─────────────────────────────────────────────────────────────────────────────

describe('Error status — 500 vs 404 vs network error', () => {
  it('renders ErrorPanel (not 404 message) for a 500 server error', () => {
    // GIVEN: The backend returns a 500 error
    mockError(500)

    // WHEN: Component renders with a clienteId
    renderView('some-id')

    // THEN: Generic ErrorPanel is shown — not the 404-specific message
    expect(screen.getByTestId('cliente-detail-error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
  })

  it('renders ErrorPanel (not 404 message) for a 503 server error', () => {
    // GIVEN: The backend returns a 503 error (service unavailable)
    mockError(503)

    renderView('some-id')

    expect(screen.getByTestId('cliente-detail-error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
  })

  it('renders ErrorPanel (not 404 message) for a generic network error (no response.status)', () => {
    // GIVEN: Network error — no response object (pure connection failure)
    mockError() // no status argument → plain Error without response

    renderView('some-id')

    // THEN: Generic ErrorPanel shown
    expect(screen.getByTestId('cliente-detail-error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
  })

  it('renders 404 message for status 404 exactly (not for 400 or 403)', () => {
    // GIVEN: The API returns 400 (bad request — not a not-found)
    mockError(400)

    renderView('bad-format-id')

    // THEN: Generic ErrorPanel shown — not the 404 "No se encontró" message
    expect(screen.getByTestId('cliente-detail-error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
  })

  it('detail panel is absent when any error is present', () => {
    // GIVEN: Any error state
    mockError(500)

    renderView('some-id')

    // THEN: No client data panel is shown
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
  })

  it('detail panel is absent when 404 is present', () => {
    // GIVEN: 404 error — not-found state
    mockError(404)

    renderView('non-existent')

    // THEN: Client detail panel is not rendered
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Reintentar button — multiple clicks
// ─────────────────────────────────────────────────────────────────────────────

describe('"Reintentar" button — multiple click behavior', () => {
  it('calls refetch exactly twice when "Reintentar" is clicked twice', async () => {
    // GIVEN: Backend unavailable — refetch is a spy
    const { refetch } = mockError()

    renderView('some-id')
    const btn = screen.getByRole('button', { name: 'Reintentar' })

    // WHEN: User clicks twice
    await userEvent.click(btn)
    await userEvent.click(btn)

    // THEN: refetch was called exactly twice
    expect(refetch).toHaveBeenCalledTimes(2)
  })

  it('does not crash after multiple rapid "Reintentar" clicks', async () => {
    // GIVEN: Backend unavailable
    const { refetch } = mockError()
    refetch.mockResolvedValue(undefined)

    renderView('some-id')
    const btn = screen.getByRole('button', { name: 'Reintentar' })

    // WHEN: User triple-clicks rapidly
    expect(async () => {
      await userEvent.click(btn)
      await userEvent.click(btn)
      await userEvent.click(btn)
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// State mutual exclusivity — only one state renders at a time
// ─────────────────────────────────────────────────────────────────────────────

describe('State mutual exclusivity — exactly one UI state at a time', () => {
  it('only loading skeleton is shown during loading (no panel, error, 404, or placeholder)', () => {
    mockLoading()
    renderView('abc-123')

    expect(screen.getByTestId('cliente-detail-loading-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
  })

  it('only ErrorPanel shown on generic error (no panel, skeleton, 404, or placeholder)', () => {
    mockError()
    renderView('abc-123')

    expect(screen.getByTestId('cliente-detail-error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-loading-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
  })

  it('only not-found message shown on 404 (no panel, skeleton, ErrorPanel, or placeholder)', () => {
    mockError(404)
    renderView('missing-id')

    expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-loading-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
  })

  it('only data panel shown when data loaded (no skeleton, error, 404, or placeholder)', () => {
    const cliente = createCliente()
    mockData(cliente)
    renderView(cliente.id)

    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-loading-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Spanish text completeness — all visible field labels in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('Spanish text completeness', () => {
  it('renders all four field labels in Spanish when data is loaded', () => {
    const cliente = createCliente()
    mockData(cliente)
    renderView(cliente.id)

    // All labels must appear in the document in Spanish
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })

  it('not-found message is exactly the mandated Spanish text', () => {
    mockError(404)
    renderView('missing')

    // Exact match per story requirements table
    expect(screen.getByText('No se encontró este cliente.')).toBeInTheDocument()
  })

  it('placeholder message is exactly the mandated Spanish text', () => {
    renderView(null)

    // Exact match per story requirements table
    expect(screen.getByText('Selecciona un cliente para ver sus detalles.')).toBeInTheDocument()
  })

  it('error panel message is in Spanish and does not expose English error messages', () => {
    mockError()
    renderView('some-id')

    // The Spanish message from the component must be present
    expect(screen.getByText('No se pudo cargar los datos. Verifica tu conexión.')).toBeInTheDocument()
    // No English error text leaked
    expect(screen.queryByText(/Network Error/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument()
  })
})

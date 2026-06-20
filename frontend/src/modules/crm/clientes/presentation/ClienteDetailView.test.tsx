// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.2: Client Detail View
// Test Level: Component (Vitest + React Testing Library)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC1 — Clicking a client item shows full detail in right panel; URL → /clientes/:clienteId
//   AC2 — Direct deep-link /clientes/:clienteId loads and displays correct client
//   AC3 — Non-existent clienteId shows Spanish not-found message (no stack traces)
//   AC4 — Backend unavailable → ErrorPanel with "Reintentar" button in right panel
//   AC5 — No client selected → placeholder state with Spanish instruction
//   AC6 — Keyboard accessibility: all interactive elements reachable; visible focus ring
//
// Test IDs required in implementation:
//   - data-testid="cliente-detail-panel"
//   - data-testid="cliente-detail-nombre"
//   - data-testid="cliente-detail-nit"
//   - data-testid="cliente-detail-telefono"
//   - data-testid="cliente-detail-ciudad"
//   - data-testid="cliente-detail-loading-skeleton"
//   - data-testid="cliente-detail-error-panel"
//   - data-testid="cliente-detail-retry-button"
//   - data-testid="cliente-detail-not-found"
//   - data-testid="cliente-detail-placeholder"
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createCliente } from '../../../../test-support/factories/cliente.factory'

// ── Module mock: useCliente hook ──────────────────────────────────────────────
// ClienteDetailView imports useCliente from its application layer.
// We mock the hook so we can control loading / error / data / 404 states.
vi.mock('../application/useCliente', () => ({
  useCliente: vi.fn(),
}))

import { useCliente } from '../application/useCliente'
// Import AFTER mock so it receives the mocked version at module load.
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
// AC5 — No client selected: placeholder state
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Placeholder state when no client is selected', () => {
  it('renders the placeholder when clienteId is null', () => {
    // GIVEN: No client is selected (clienteId = null)
    // WHEN: ClienteDetailView is rendered without a clienteId
    renderView(null)

    // THEN: Placeholder is visible
    expect(screen.getByTestId('cliente-detail-placeholder')).toBeInTheDocument()
  })

  it('displays the Spanish placeholder instruction text', () => {
    // GIVEN: No client is selected
    // WHEN: ClienteDetailView is rendered
    renderView(null)

    // THEN: The exact Spanish instruction is shown
    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.'),
    ).toBeInTheDocument()
  })

  it('does NOT call useCliente when clienteId is null', () => {
    // GIVEN: No client is selected
    // WHEN: ClienteDetailView is rendered
    renderView(null)

    // THEN: useCliente is not called (or called with null/undefined — query is disabled)
    // The hook must not make a network call when clienteId is absent
    expect(screen.queryByTestId('cliente-detail-loading-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
  })

  it('placeholder has role="status" for accessibility', () => {
    // GIVEN: No client is selected
    // WHEN: ClienteDetailView is rendered
    renderView(null)

    // THEN: Placeholder element has role="status" per ARIA spec
    const placeholder = screen.getByTestId('cliente-detail-placeholder')
    expect(placeholder).toHaveAttribute('role', 'status')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading state — skeleton placeholders (AC2 — deep link loading)
// ─────────────────────────────────────────────────────────────────────────────

describe('Loading state — skeleton placeholders', () => {
  it('renders loading skeleton when isLoading=true', () => {
    // GIVEN: A clienteId is provided and the API call is in progress
    mockLoading()

    // WHEN: ClienteDetailView is rendered with a clienteId
    renderView('abc-123')

    // THEN: Skeleton placeholder is visible (not the real content)
    expect(screen.getByTestId('cliente-detail-loading-skeleton')).toBeInTheDocument()
  })

  it('does NOT render client detail fields during loading', () => {
    // GIVEN: The API call is in progress
    mockLoading()

    // WHEN: ClienteDetailView is rendered
    renderView('abc-123')

    // THEN: Detail fields are not rendered prematurely
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
  })

  it('does NOT render ErrorPanel during loading', () => {
    // GIVEN: The API call is in progress
    mockLoading()

    // WHEN: ClienteDetailView is rendered
    renderView('abc-123')

    // THEN: ErrorPanel is not shown during loading
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
  })

  it('does NOT render placeholder during loading', () => {
    // GIVEN: A clienteId is set and loading is in progress
    mockLoading()

    // WHEN: ClienteDetailView is rendered
    renderView('abc-123')

    // THEN: Placeholder is not shown when a clienteId is present
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC2 — Client detail renders complete data
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 + AC2 — Client detail displays complete client information', () => {
  it('renders the detail panel when client data is loaded', () => {
    // GIVEN: A client exists and useCliente returns its data
    const cliente = createCliente()
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderView(cliente.id)

    // THEN: The detail panel container is present
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
  })

  it('displays the client Nombre in the detail view', () => {
    // GIVEN: A client with a specific Nombre
    const cliente = createCliente({ nombre: 'Construcciones del Valle' })
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The Nombre is visible in the detail panel
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent(
      'Construcciones del Valle',
    )
  })

  it('displays the client NIT/RUC in the detail view', () => {
    // GIVEN: A client with a specific NIT
    const cliente = createCliente({ nit: '900123456-1' })
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The NIT/RUC is visible in the detail panel
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900123456-1')
  })

  it('displays the client Telefono in the detail view', () => {
    // GIVEN: A client with a specific Telefono
    const cliente = createCliente({ telefono: '+57 300 123 4567' })
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The Telefono is visible in the detail panel
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('+57 300 123 4567')
  })

  it('displays the client Ciudad in the detail view', () => {
    // GIVEN: A client with a specific Ciudad
    const cliente = createCliente({ ciudad: 'Medellín' })
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The Ciudad is visible in the detail panel
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Medellín')
  })

  it('renders all four required fields simultaneously for a loaded client', () => {
    // GIVEN: A fully populated client
    const cliente = createCliente({
      nombre: 'Inversiones Andinas',
      nit: '800987654-2',
      telefono: '+57 4 456 7890',
      ciudad: 'Bogotá',
    })
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: All four fields are visible simultaneously
    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Inversiones Andinas')
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('800987654-2')
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('+57 4 456 7890')
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá')
  })

  it('does NOT render placeholder when a client is loaded', () => {
    // GIVEN: A client with data is loaded
    const cliente = createCliente()
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: Placeholder is not shown when data is present
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument()
  })

  it('renders field label "Nombre" in the detail view', () => {
    // GIVEN: A client is loaded
    const cliente = createCliente()
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The Spanish label "Nombre" is visible
    expect(screen.getByText('Nombre')).toBeInTheDocument()
  })

  it('renders field label "NIT/RUC" in the detail view', () => {
    // GIVEN: A client is loaded
    const cliente = createCliente()
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The Spanish label "NIT/RUC" is visible
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Non-existent clienteId: not-found message in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Not-found state for non-existent clienteId', () => {
  it('renders the not-found message when the API returns 404', () => {
    // GIVEN: The API returns 404 for the requested clienteId
    mockError(404)

    // WHEN: ClienteDetailView is rendered with a non-existent clienteId
    renderView('non-existent-id')

    // THEN: The Spanish not-found message is displayed
    expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument()
  })

  it('displays the exact Spanish not-found text for 404 errors', () => {
    // GIVEN: The API returns 404
    mockError(404)

    // WHEN: ClienteDetailView is rendered
    renderView('non-existent-id')

    // THEN: The exact Spanish text is shown
    expect(screen.getByText('No se encontró este cliente.')).toBeInTheDocument()
  })

  it('does NOT show the generic ErrorPanel for a 404 response', () => {
    // GIVEN: The API returns 404
    mockError(404)

    // WHEN: ClienteDetailView is rendered
    renderView('non-existent-id')

    // THEN: The generic error panel is NOT shown (404 has its own specific UI)
    expect(screen.queryByTestId('cliente-detail-error-panel')).not.toBeInTheDocument()
  })

  it('does NOT expose raw error message or stack trace to the user on 404', () => {
    // GIVEN: The API returns 404
    mockError(404)

    // WHEN: ClienteDetailView is rendered
    renderView('non-existent-id')

    // THEN: No technical error text is visible
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/404/)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Backend unavailable: ErrorPanel with "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ErrorPanel on backend unavailable', () => {
  it('renders ErrorPanel when useCliente returns isError=true (non-404)', () => {
    // GIVEN: The backend is unavailable (non-404 network failure)
    mockError()

    // WHEN: ClienteDetailView is rendered with a clienteId
    renderView('some-id')

    // THEN: ErrorPanel is visible in the right panel
    expect(screen.getByTestId('cliente-detail-error-panel')).toBeInTheDocument()
  })

  it('shows a "Reintentar" button when the fetch fails', () => {
    // GIVEN: The backend is unavailable
    mockError()

    // WHEN: ClienteDetailView is rendered
    renderView('some-id')

    // THEN: The "Reintentar" retry button is visible
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('calls refetch when the "Reintentar" button is clicked', async () => {
    // GIVEN: The backend is unavailable and refetch is a spy
    const { refetch } = mockError()

    // WHEN: User clicks "Reintentar"
    renderView('some-id')
    const retryButton = screen.getByRole('button', { name: 'Reintentar' })
    await userEvent.click(retryButton)

    // THEN: refetch is called once
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('does NOT render client detail fields when an error occurs', () => {
    // GIVEN: The backend is unavailable
    mockError()

    // WHEN: ClienteDetailView is rendered
    renderView('some-id')

    // THEN: Detail fields are not rendered (ErrorPanel takes over)
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
  })

  it('does NOT expose raw error.message to the user on fetch failure', () => {
    // GIVEN: The backend is unavailable
    mockError()

    // WHEN: ClienteDetailView is rendered
    renderView('some-id')

    // THEN: No technical error text (stack traces, "Network Error", etc.) is visible
    expect(screen.queryByText(/Network Error/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Keyboard accessibility (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Keyboard accessibility', () => {
  it('placeholder has an accessible role attribute', () => {
    // GIVEN: No client selected
    // WHEN: ClienteDetailView is rendered without a clienteId
    renderView(null)

    // THEN: The placeholder announces itself as a status region
    const placeholder = screen.getByTestId('cliente-detail-placeholder')
    expect(placeholder).toHaveAttribute('role', 'status')
  })

  it('not-found message has an accessible role for screen readers', () => {
    // GIVEN: The API returns 404
    mockError(404)

    // WHEN: ClienteDetailView is rendered
    renderView('non-existent-id')

    // THEN: Not-found message element has a role attribute (status or alert)
    const notFound = screen.getByTestId('cliente-detail-not-found')
    const role = notFound.getAttribute('role')
    expect(role === 'status' || role === 'alert').toBe(true)
  })

  it('"Reintentar" button is reachable by Tab key when ErrorPanel is shown', async () => {
    // GIVEN: The backend is unavailable
    mockError()
    renderView('some-id')

    // WHEN: User presses Tab
    await userEvent.tab()

    // THEN: The "Reintentar" button is focused
    const retryButton = screen.getByRole('button', { name: 'Reintentar' })
    expect(retryButton).toHaveFocus()
  })

  it('detail panel is rendered inside a semantically appropriate container', () => {
    // GIVEN: A client is loaded
    const cliente = createCliente()
    mockData(cliente)

    // WHEN: ClienteDetailView is rendered
    renderView(cliente.id)

    // THEN: The detail panel container is present and accessible
    const panel = screen.getByTestId('cliente-detail-panel')
    expect(panel).toBeInTheDocument()
  })
})

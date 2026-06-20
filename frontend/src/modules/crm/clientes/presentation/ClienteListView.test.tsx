// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.1: Client List & Search
// Test Level: Component (Vitest + React Testing Library + MSW)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC1 — Left panel renders scrollable list: Nombre + NIT/RUC per item
//   AC2 — Real-time case-insensitive search by Nombre or NIT/RUC (< 1 s, ≤ 500 records)
//   AC3 — EmptyState when no clients exist
//   AC4 — ErrorPanel + "Reintentar" button on fetch failure; no raw error exposed
//   AC5 — Each item shows Nombre (primary) + NIT/RUC (secondary)
//   AC6 — Keyboard accessibility: Tab order, visible focus ring
//
// Test IDs required in implementation:
//   - data-testid="cliente-list-panel"
//   - data-testid="cliente-search-input"
//   - data-testid="cliente-list"
//   - data-testid="cliente-list-item"       (one per item)
//   - data-testid="cliente-empty-state"
//   - data-testid="cliente-error-panel"
//   - data-testid="cliente-retry-button"
//   - data-testid="cliente-loading-skeleton"
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createCliente, createClientes } from '../../../../test-support/factories/cliente.factory'

// ── Module mock: useClientes hook ─────────────────────────────────────────────
// ClienteListView imports useClientes from its application layer.
// We mock the hook entirely so we can control loading / error / data states.
vi.mock('../application/useClientes', () => ({
  useClientes: vi.fn(),
}))

import { useClientes } from '../application/useClientes'
// We import ClienteListView AFTER the mock so it receives the mock at module load.
import { ClienteListView } from './ClienteListView'

// ── Test wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderView() {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ClienteListView />
    </QueryClientProvider>,
  )
}

// ── Shared mock helper ────────────────────────────────────────────────────────

const mockUseClientes = useClientes as ReturnType<typeof vi.fn>

function mockLoading() {
  mockUseClientes.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() })
}

function mockError() {
  const refetch = vi.fn()
  mockUseClientes.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch })
  return { refetch }
}

function mockData(clientes: ReturnType<typeof createCliente>[]) {
  mockUseClientes.mockReturnValue({ data: clientes, isLoading: false, isError: false, refetch: vi.fn() })
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC5 — Client list renders with Nombre and NIT/RUC visible
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 + AC5 — ClienteListView renders client list', () => {
  it('renders the left panel with fixed 280px width wrapper', () => {
    // GIVEN: Two clients exist
    const clientes = [createCliente(), createCliente()]
    mockData(clientes)

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The left panel container is present
    const panel = screen.getByTestId('cliente-list-panel')
    expect(panel).toBeInTheDocument()
  })

  it('renders a list item for each client returned by useClientes', () => {
    // GIVEN: Three clients exist
    const clientes = createClientes(3)
    mockData(clientes)

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: Three list items are rendered
    const items = screen.getAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)
  })

  it('displays Nombre as primary text on each client item', () => {
    // GIVEN: A client with a specific Nombre
    const cliente = createCliente({ nombre: 'Construcciones del Valle' })
    mockData([cliente])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The Nombre is visible in the list
    expect(screen.getByText('Construcciones del Valle')).toBeInTheDocument()
  })

  it('displays NIT/RUC as secondary text on each client item', () => {
    // GIVEN: A client with a specific NIT
    const cliente = createCliente({ nit: '900123456-1' })
    mockData([cliente])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The NIT/RUC is visible in the list
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
  })

  it('renders both Nombre and NIT/RUC for the same client item', () => {
    // GIVEN: A client with known Nombre and NIT
    const cliente = createCliente({ nombre: 'Inversiones Andinas', nit: '800987654-2' })
    mockData([cliente])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: Both fields are visible simultaneously
    expect(screen.getByText('Inversiones Andinas')).toBeInTheDocument()
    expect(screen.getByText('800987654-2')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time case-insensitive search (no debounce, < 1 s)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Real-time search filtering', () => {
  it('renders the search input with correct aria-label and placeholder', () => {
    // GIVEN: No clients (empty list)
    mockData([])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The search input has the correct Spanish aria-label and placeholder
    const input = screen.getByRole('textbox', { name: 'Buscar clientes' })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC')
  })

  it('filters the list to show only items matching typed nombre', async () => {
    // GIVEN: Two clients with different nombres
    const matching = createCliente({ nombre: 'Construcciones del Valle' })
    const nonMatching = createCliente({ nombre: 'Inversiones Andinas' })
    mockData([matching, nonMatching])

    // WHEN: User types "Construcciones" in the search field
    renderView()
    const input = screen.getByTestId('cliente-search-input')
    await userEvent.type(input, 'Construcciones')

    // THEN: Only the matching client is visible
    expect(screen.getByText('Construcciones del Valle')).toBeInTheDocument()
    expect(screen.queryByText('Inversiones Andinas')).not.toBeInTheDocument()
  })

  it('filters the list to show only items matching typed NIT/RUC', async () => {
    // GIVEN: Two clients with different NITs
    const matching = createCliente({ nit: '900123456-1' })
    const nonMatching = createCliente({ nit: '800987654-2' })
    mockData([matching, nonMatching])

    // WHEN: User types "900123456" in the search field
    renderView()
    const input = screen.getByTestId('cliente-search-input')
    await userEvent.type(input, '900123456')

    // THEN: Only the NIT-matching client is visible
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
    expect(screen.queryByText('800987654-2')).not.toBeInTheDocument()
  })

  it('search is case-insensitive: "construc" matches "Construcciones del Valle"', async () => {
    // GIVEN: A client with a mixed-case Nombre
    const cliente = createCliente({ nombre: 'Construcciones del Valle' })
    mockData([cliente])

    // WHEN: User types lowercase "construc"
    renderView()
    const input = screen.getByTestId('cliente-search-input')
    await userEvent.type(input, 'construc')

    // THEN: The client is still visible (case-insensitive match)
    expect(screen.getByText('Construcciones del Valle')).toBeInTheDocument()
  })

  it('shows all clients when the search field is cleared', async () => {
    // GIVEN: Two clients and a search term typed then cleared
    const c1 = createCliente({ nombre: 'ACME Corp' })
    const c2 = createCliente({ nombre: 'Beta Ltda' })
    mockData([c1, c2])

    renderView()
    const input = screen.getByTestId('cliente-search-input')
    await userEvent.type(input, 'ACME')

    // WHEN: User clears the search field
    await userEvent.clear(input)

    // THEN: Both clients are visible again
    expect(screen.getByText('ACME Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument()
  })

  it('shows no results message when search term matches nothing', async () => {
    // GIVEN: One client that won't match the search
    const cliente = createCliente({ nombre: 'Empresa Real', nit: '100000000-0' })
    mockData([cliente])

    // WHEN: User types a non-matching term
    renderView()
    const input = screen.getByTestId('cliente-search-input')
    await userEvent.type(input, 'XYZNOTFOUND')

    // THEN: No list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — EmptyState when client list is empty', () => {
  it('renders EmptyState component when data is an empty array', () => {
    // GIVEN: The server returns 0 clients
    mockData([])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: EmptyState is visible
    expect(screen.getByTestId('cliente-empty-state')).toBeInTheDocument()
  })

  it('EmptyState displays the correct Spanish guidance message', () => {
    // GIVEN: The server returns 0 clients
    mockData([])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The Spanish message is displayed
    expect(screen.getByText('Aún no hay clientes. Crea el primero.')).toBeInTheDocument()
  })

  it('does NOT render any list items when data is empty', () => {
    // GIVEN: The server returns 0 clients
    mockData([])

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: No client list items exist
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel + "Reintentar" button on fetch failure
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ErrorPanel on fetch failure', () => {
  it('renders ErrorPanel when useClientes returns isError=true', () => {
    // GIVEN: The API call fails
    mockError()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: ErrorPanel is visible
    expect(screen.getByTestId('cliente-error-panel')).toBeInTheDocument()
  })

  it('displays the Spanish error message without exposing raw error', () => {
    // GIVEN: The API call fails
    mockError()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The user-friendly Spanish error message is shown
    expect(
      screen.getByText('No se pudo cargar la lista. Verifica tu conexión.'),
    ).toBeInTheDocument()
  })

  it('shows a "Reintentar" button in the ErrorPanel', () => {
    // GIVEN: The API call fails
    mockError()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The retry button is visible with correct Spanish label
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('calls refetch when the "Reintentar" button is clicked', async () => {
    // GIVEN: The API call fails and refetch is a spy
    const { refetch } = mockError()

    // WHEN: User clicks the "Reintentar" button
    renderView()
    const retryButton = screen.getByRole('button', { name: 'Reintentar' })
    await userEvent.click(retryButton)

    // THEN: refetch is called once
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('does NOT render the client list when an error occurs', () => {
    // GIVEN: The API call fails
    mockError()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: No client list items are rendered (ErrorPanel takes over)
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('does NOT expose raw error.message to the user', () => {
    // GIVEN: The API call fails
    mockError()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: No technical error text (stack traces, "Network Error", etc.) is visible
    // The only error text should be our friendly Spanish message
    expect(screen.queryByText(/Network Error/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading state (skeleton placeholders)
// ─────────────────────────────────────────────────────────────────────────────

describe('Loading state — skeleton placeholders', () => {
  it('renders loading skeleton when isLoading=true', () => {
    // GIVEN: The API call is in progress
    mockLoading()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: Skeleton placeholders are visible (not a real list)
    expect(screen.getByTestId('cliente-loading-skeleton')).toBeInTheDocument()
  })

  it('does NOT render client list items during loading', () => {
    // GIVEN: The API call is in progress
    mockLoading()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: No real list items are rendered yet
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('does NOT render EmptyState during loading', () => {
    // GIVEN: The API call is in progress
    mockLoading()

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: EmptyState is not shown during loading
    expect(screen.queryByTestId('cliente-empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Keyboard accessibility (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Keyboard accessibility', () => {
  it('search input has aria-label "Buscar clientes"', () => {
    // GIVEN: Clients exist
    mockData(createClientes(1))

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: The search input has the required aria-label
    const input = screen.getByLabelText('Buscar clientes')
    expect(input).toBeInTheDocument()
  })

  it('search input is reachable by Tab key', async () => {
    // GIVEN: Clients exist
    mockData(createClientes(2))

    // WHEN: User presses Tab from the document body
    renderView()
    await userEvent.tab()

    // THEN: The search input is focused
    const input = screen.getByTestId('cliente-search-input')
    expect(input).toHaveFocus()
  })

  it('client list items are keyboard-activatable (button role or equivalent)', () => {
    // GIVEN: Clients exist
    const clientes = createClientes(2)
    mockData(clientes)

    // WHEN: ClienteListView is rendered
    renderView()

    // THEN: Each client item is reachable by keyboard (button or role="listitem" with tabIndex)
    const items = screen.getAllByTestId('cliente-list-item')
    items.forEach((item) => {
      // Each item must be a button OR have a non-negative tabIndex
      const isButton = item.tagName.toLowerCase() === 'button'
      const hasTabIndex = item.getAttribute('tabindex') !== null && item.getAttribute('tabindex') !== '-1'
      expect(isButton || hasTabIndex).toBe(true)
    })
  })
})

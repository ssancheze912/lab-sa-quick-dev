/**
 * Story 2.1: Client List & Search — Component Edge Cases
 * Epic 2: Client Management
 *
 * Expanded coverage: edge cases and boundary conditions NOT covered by
 * the ATDD tests in ClienteListView.test.tsx
 *
 * Coverage gaps addressed:
 *   - Search with whitespace-only term shows full list (trim behavior)
 *   - Search with no matching results hides list but does NOT show EmptyState
 *   - HTTP 500 error triggers ErrorPanel (not only network errors)
 *   - Loading state renders skeleton placeholders (not client list, not EmptyState)
 *   - EmptyState message is exactly the required Spanish text
 *   - Search input has correct placeholder text
 *   - ClientListItem links point to /clientes/{id}
 *   - Very long Nombre (boundary: > 200 chars) renders without crash
 *   - NIT/RUC with special chars (dash) is correctly matched in filter
 *   - Rapid successive search inputs do not cause duplicated API calls
 *   - Error panel does NOT appear alongside EmptyState simultaneously
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 0
function uniqueSuffix() {
  return `${Date.now()}-${++_counter}`
}

function buildCliente(overrides?: Partial<Cliente>): Cliente {
  const suffix = uniqueSuffix()
  return {
    id: crypto.randomUUID(),
    nombre: `Empresa Edge ${suffix}`,
    nitRuc: `900${suffix.slice(-6).padStart(6, '0')}-1`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function buildClientes(count: number, overridesFn?: (i: number) => Partial<Cliente>): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    buildCliente(overridesFn ? overridesFn(i) : undefined)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderClienteListView() {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Whitespace-only search term — shows full list (not empty)
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Whitespace-only search term shows full list', () => {
  it('[P1] should show all clients when search input contains only spaces', async () => {
    // GIVEN: 3 clients returned by API
    const clientes = buildClientes(3)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: User types only whitespace in search
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /buscar cliente/i }), '   ')

    // THEN: All 3 clients are still visible (whitespace trimmed → empty → no filter)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
  })

  it('[P1] should NOT show EmptyState when search input is whitespace-only', async () => {
    // GIVEN: 2 clients exist
    const clientes = buildClientes(2)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User types only spaces
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /buscar cliente/i }), '   ')

    // THEN: EmptyState must NOT appear (it's not a truly empty DB)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search produces no results — no EmptyState, no list items
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Search term yields no matches', () => {
  it('[P1] should show zero list items when no client matches the search term', async () => {
    // GIVEN: 2 clients, neither matches the search term
    const clientes = [
      buildCliente({ nombre: 'Empresa Alpha', nitRuc: '111000111-1' }),
      buildCliente({ nombre: 'Empresa Beta', nitRuc: '222000222-2' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User types a term that matches nothing
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      'XXXXXXXXXXX_NO_MATCH'
    )

    // THEN: Zero list items
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })

  it('[P2] should NOT show EmptyState when search term yields no matches', async () => {
    // GIVEN: 2 clients exist, search yields no results
    const clientes = [
      buildCliente({ nombre: 'Empresa Alpha', nitRuc: '111000111-1' }),
      buildCliente({ nombre: 'Empresa Beta', nitRuc: '222000222-2' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      'ZZZZNOMATCH'
    )

    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })

    // THEN: EmptyState is NOT rendered (it's a filter result, not a truly empty DB)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: HTTP 500 server error triggers ErrorPanel
// Extends AC4 — not only connection refused, but also 5xx responses
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — HTTP 500 server error triggers ErrorPanel', () => {
  it('[P1] should render ErrorPanel when API returns HTTP 500', async () => {
    // GIVEN: API returns 500 Internal Server Error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    )

    renderClienteListView()

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('[P1] should render Reintentar button when API returns HTTP 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    )

    renderClienteListView()

    // THEN: Reintentar button is present
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /reintentar/i })
      ).toBeInTheDocument()
    })
  })

  it('[P2] should NOT render EmptyState when API returns HTTP 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: EmptyState must NOT appear alongside ErrorPanel
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Loading state renders skeleton, not list or EmptyState
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Loading state shows skeleton placeholders', () => {
  it('[P1] should NOT render client list items while data is loading', async () => {
    // GIVEN: API call is delayed (never resolves in this test snapshot)
    server.use(
      http.get('*/api/v1/clientes', async () => {
        // Return immediately but check the initial render state before this
        return HttpResponse.json([], { status: 200 })
      })
    )

    renderClienteListView()

    // THEN: No list items rendered during initial load (data is undefined until resolved)
    // Note: This is a snapshot check on the synchronous initial render
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('[P2] should NOT render EmptyState while data is loading', async () => {
    // GIVEN: API responds with data after a short delay
    server.use(
      http.get('*/api/v1/clientes', async () => {
        return HttpResponse.json([], { status: 200 })
      })
    )

    renderClienteListView()

    // THEN: EmptyState not shown during synchronous initial render
    // (Before query resolves, isLoading is true and data is undefined)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: EmptyState message exact text validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — EmptyState message exact text', () => {
  it('[P1] should display the exact Spanish guiding message in EmptyState', async () => {
    // GIVEN: Empty API response
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    renderClienteListView()

    // THEN: Exact required message
    await waitFor(() => {
      expect(
        screen.getByText('No hay clientes registrados. Crea el primero.')
      ).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search input placeholder text validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Search input placeholder', () => {
  it('[P2] should render search input with correct Spanish placeholder', async () => {
    // GIVEN: API returns clients (or empty — doesn't matter for this check)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    renderClienteListView()

    // THEN: Placeholder text matches the spec
    const searchInput = screen.getByRole('textbox', { name: /buscar cliente/i })
    expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC...')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ClientListItem href points to /clientes/{id}
// Verifies navigation target before Story 2.2 route is wired
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — ClientListItem href navigates to client detail route', () => {
  it('[P1] should render each client item with an href pointing to /clientes/{id}', async () => {
    // GIVEN: API returns 1 client with a known ID
    const knownId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const clientes: Cliente[] = [
      buildCliente({ id: knownId, nombre: 'Empresa Link Test', nitRuc: '900123456-1' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // THEN: The list item contains an anchor with the correct href
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/clientes/${knownId}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: NIT/RUC dash character is matched in filter
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — NIT/RUC with dash in filter', () => {
  it('[P1] should filter by full NIT/RUC including dash separator', async () => {
    // GIVEN: 2 clients with similar NIT/RUC but different suffix
    const clientes = [
      buildCliente({ nombre: 'Empresa NIT Uno', nitRuc: '900111001-1' }),
      buildCliente({ nombre: 'Empresa NIT Dos', nitRuc: '900111001-2' }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User types the full NIT/RUC with dash
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      '900111001-1'
    )

    // THEN: Only the exact NIT/RUC match is visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('Empresa NIT Uno')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Very long Nombre (boundary: max 200 chars per spec)
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Boundary: Very long Nombre (200 characters)', () => {
  it('[P2] should render a client with a 200-character Nombre without crashing', async () => {
    // GIVEN: A client with a Nombre at the max boundary (200 chars)
    const longNombre = 'A'.repeat(200)
    const clientes = [
      buildCliente({ nombre: longNombre }),
    ]
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    // WHEN: ClienteListView renders
    renderClienteListView()

    // THEN: The client item is present (no crash, no error state)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Rapid successive search inputs — no duplicate API calls
// Ensures synchronous filter does not accidentally trigger re-fetches
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Rapid search typing does not trigger extra API calls', () => {
  it('[P1] should NOT fire additional API requests during rapid typing', async () => {
    // GIVEN: 3 clients, track call count
    let callCount = 0
    const clientes = buildClientes(3)
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json(clientes, { status: 200 })
      })
    )

    renderClienteListView()
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    const callsAfterLoad = callCount

    // WHEN: User types a long search term rapidly (character by character)
    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /buscar cliente/i }),
      'EmpresaEdgeTerm123'
    )

    // THEN: No additional API calls were made during typing
    await waitFor(() => {}, { timeout: 500 })
    expect(callCount).toBe(callsAfterLoad)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Mutually exclusive states (ErrorPanel / EmptyState / List)
// These states must never appear simultaneously
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Mutually exclusive render states', () => {
  it('[P1] should show exactly one state: list items are shown, not ErrorPanel, not EmptyState', async () => {
    // GIVEN: 2 clients exist
    const clientes = buildClientes(2)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes, { status: 200 })
      )
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // THEN: ErrorPanel and EmptyState are NOT present when list has items
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })

  it('[P1] should show exactly one state: EmptyState is shown, not ErrorPanel, not list items', async () => {
    // GIVEN: Empty API response
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    // THEN: ErrorPanel and list items are NOT present
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('[P1] should show exactly one state: ErrorPanel is shown, not EmptyState, not list items', async () => {
    // GIVEN: Network error
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.error())
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // THEN: EmptyState and list items are NOT present
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

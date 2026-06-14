/**
 * Story 2.1: Client List & Search — Component Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - ClienteListView component does not exist yet
 * - useClientes hook does not exist yet
 * - EmptyState component does not exist yet
 * - ErrorPanel component does not exist yet
 *
 * Acceptance Criteria covered:
 *   AC#1 — Left panel renders scrollable list with Nombre and NIT/RUC per item
 *   AC#2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive)
 *   AC#3 — Clearing search restores full list without a new API call
 *   AC#4 — EmptyState shown when API returns []
 *   AC#5 — ErrorPanel with "Reintentar" shown when fetch fails
 *   AC#6 — Skeleton placeholder shown during initial load
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-06: List renders Nombre + NIT (AC#1)
 *   TC-E2-P1-07: Real-time search filter (AC#2)
 *   TC-E2-P0-05: Search perf 500 records ≤150ms (AC#2 / NFR1)
 *   TC-E2-P2-01: EmptyState on empty list (AC#4)
 *   TC-E2-P2-02: ErrorPanel + Reintentar refetch (AC#5)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// RED: These imports will fail until implementation exists.
// Expected failures: "Cannot find module '../ClienteListView'"
import { ClienteListView } from '../ClienteListView'
import { createCliente, createClientes, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes`, () => {
    return HttpResponse.json([
      createCliente({ nombre: 'Empresa ABC', nit: '900100200-1' }),
      createCliente({ nombre: 'Garcia & Co', nit: '800200300-2' }),
      createCliente({ nombre: 'Tecnología del Futuro', nit: '700300400-3' }),
    ])
  })
)

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

// ─── AC#6: Loading State (Skeleton) ───────────────────────────────────────────

describe('ClienteListView — AC#6: Loading state', () => {
  it('should render skeleton placeholder while data is loading', async () => {
    // GIVEN: network response is delayed (data not yet arrived)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        // Deliberately slow response — never resolves within test assertion window
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return HttpResponse.json([])
      })
    )

    // WHEN: ClienteListView is rendered
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: skeleton placeholder is visible in the left panel
    // Expected failure: Cannot find module '../ClienteListView'
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument()
  })
})

// ─── AC#1: Client List Renders with Nombre and NIT/RUC ────────────────────────

describe('ClienteListView — AC#1: Client list rendering (TC-E2-P1-06)', () => {
  it('should render all client items once data arrives', async () => {
    // GIVEN: MSW returns 3 clients

    // WHEN: component is rendered
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: after loading resolves, 3 list items are rendered
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
  })

  it('should display Nombre for each client item (AC#1)', async () => {
    // GIVEN: MSW returns clients including "Empresa ABC"

    // WHEN: component renders and data loads
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: client Nombre is visible
    await waitFor(() => {
      expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    })
  })

  it('should display NIT/RUC for each client item (AC#1)', async () => {
    // GIVEN: MSW returns client with NIT "900100200-1"

    // WHEN: component renders and data loads
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: NIT/RUC text is visible
    await waitFor(() => {
      expect(screen.getByText('900100200-1')).toBeInTheDocument()
    })
  })

  it('should render the list panel with correct ARIA role (AC#1)', async () => {
    // GIVEN: data loaded

    // WHEN: component renders
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: list container has role="listbox" and aria-label per story spec
    await waitFor(() => {
      expect(
        screen.getByRole('listbox', { name: 'Lista de clientes' })
      ).toBeInTheDocument()
    })
  })

  it('should render a search input with aria-label "Buscar cliente" (AC#1)', async () => {
    // WHEN: component renders
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: search input exists with accessible label
    // No need to wait for data — input is part of the panel layout
    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Buscar cliente' })).toBeInTheDocument()
    })
  })
})

// ─── AC#2: Real-Time Search Filter ────────────────────────────────────────────

describe('ClienteListView — AC#2: Real-time search filter (TC-E2-P1-07)', () => {
  it('should filter list by Nombre when user types in search field', async () => {
    // GIVEN: 3 clients loaded (Empresa ABC, Garcia & Co, Tecnología del Futuro)
    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: user types "Garcia" in the search field
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'Garcia')

    // THEN: only matching client is visible
    expect(screen.getByText('Garcia & Co')).toBeInTheDocument()
    expect(screen.queryByText('Empresa ABC')).not.toBeInTheDocument()
    expect(screen.queryByText('Tecnología del Futuro')).not.toBeInTheDocument()
  })

  it('should filter list by NIT/RUC when user types in search field (AC#2)', async () => {
    // GIVEN: 3 clients loaded with distinct NITs
    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: user types a NIT fragment
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), '900100200')

    // THEN: only client with that NIT is visible
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.queryByText('Garcia & Co')).not.toBeInTheDocument()
  })

  it('should be case-insensitive in search (AC#2)', async () => {
    // GIVEN: client named "Empresa ABC" (mixed case)
    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: user types in lowercase
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'empresa abc')

    // THEN: match is found despite different case
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
  })

  it('should show "Sin resultados" message when search has no matches (AC#2)', async () => {
    // GIVEN: data loaded
    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: user types a term that matches nothing
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar cliente' }),
      'XYZ_NO_EXISTE_9999'
    )

    // THEN: "Sin resultados" message appears
    expect(screen.getByText(/sin resultados para/i)).toBeInTheDocument()
  })
})

// ─── AC#2 / NFR1: Search Performance with 500 Records ─────────────────────────

describe('ClienteListView — AC#2 / NFR1: Search performance (TC-E2-P0-05)', () => {
  it('should filter 500 records in under 150ms (NFR1 requirement)', async () => {
    // GIVEN: 500 clients loaded via MSW
    const clientes500 = [
      ...Array.from({ length: 50 }, (_, i) =>
        createCliente({ nombre: `Empresa Siesa ${i}`, nit: `900${i.toString().padStart(6, '0')}-1` })
      ),
      ...Array.from({ length: 450 }, (_, i) =>
        createCliente({ nombre: `Otro Proveedor ${i}`, nit: `800${i.toString().padStart(6, '0')}-2` })
      ),
    ]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes500))
    )

    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    })

    // WHEN: user types a search term — measure elapsed time
    const t0 = performance.now()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'Siesa')
    const elapsed = performance.now() - t0

    // THEN: filter completes in under 150ms (well within NFR1 1s limit)
    expect(elapsed).toBeLessThan(150)

    // AND: only "Empresa Siesa" clients are shown
    const visibleItems = screen.getAllByTestId('cliente-list-item')
    expect(visibleItems.length).toBe(50)
  })
})

// ─── AC#3: Clear Search Restores Full List ────────────────────────────────────

describe('ClienteListView — AC#3: Clear search restores full list', () => {
  it('should restore full list when search input is cleared', async () => {
    // GIVEN: 3 clients loaded; user has filtered by "Garcia"
    const user = userEvent.setup()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    const searchInput = screen.getByRole('searchbox', { name: 'Buscar cliente' })
    await user.type(searchInput, 'Garcia')

    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)

    // WHEN: user clears the search field
    await user.clear(searchInput)

    // THEN: full list is restored — all 3 items visible
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
  })
})

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

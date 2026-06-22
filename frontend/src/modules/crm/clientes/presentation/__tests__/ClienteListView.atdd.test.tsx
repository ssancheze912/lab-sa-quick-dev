import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteListView } from '../ClienteListView'

/**
 * ATDD — Story 2.1: Client List & Search — Component tests (RED phase)
 *
 * All tests FAIL until ClienteListView is implemented.
 *
 * Acceptance Criteria:
 *   AC1 — Left panel 280px fixed width, scrollable, shows Nombre + NIT/RUC
 *   AC2 — Real-time filter by Nombre or NIT/RUC, case-insensitive
 *   AC3 — EmptyState with CTA when API returns []
 *   AC4 — ErrorPanel with "Reintentar" when API returns 503
 *   AC5 — EmptyState "Sin resultados" when search matches nothing
 *
 * Priority alignment (test-design-epic-2.md):
 *   P0 → R-003 (NFR1: filter 500 records <1s)
 *   P1 → R-006 (EmptyState), ErrorPanel + Reintentar
 *   P3 → R-010 (Reintentar triggers refetch)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Data factories
// ─────────────────────────────────────────────────────────────────────────────

interface ClienteDto {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

let _counter = 0
function createClienteDto(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const id = `id-${++_counter}`
  const ts = new Date().toISOString()
  return {
    id,
    nombre: `Cliente Test ${id}`,
    nit: `900${id.replace('id-', '').padStart(6, '0')}`,
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  }
}

function createClienteDtos(count: number, overrides: Partial<ClienteDto> = {}): ClienteDto[] {
  return Array.from({ length: count }, (_, i) =>
    createClienteDto({ nombre: `Cliente ${i + 1}`, nit: `NIT${String(i + 1).padStart(6, '0')}`, ...overrides }),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — List renders with Nombre and NIT/RUC per item
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — clientes-list-panel renders with client items', () => {
  it('renders clientes-list-panel with data-testid', async () => {
    // GIVEN: API returns one client
    const cliente = createClienteDto({ nombre: 'Empresa Uno', nit: '900123456' })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: The list panel is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })

  it('renders a cliente-list-item for each client returned by the API', async () => {
    // GIVEN: API returns two clients
    const clientes = [
      createClienteDto({ nombre: 'Empresa Alfa' }),
      createClienteDto({ nombre: 'Empresa Beta' }),
    ]
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: Two list items are visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
    })
  })

  it('displays Nombre prominently in each client item', async () => {
    // GIVEN: API returns a client with a specific nombre
    const cliente = createClienteDto({ nombre: 'Empresa Única SA' })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: The nombre is visible in the item
    await waitFor(() => {
      expect(screen.getByTestId('cliente-item-nombre')).toHaveTextContent('Empresa Única SA')
    })
  })

  it('displays NIT/RUC as subtext in each client item', async () => {
    // GIVEN: API returns a client with a specific NIT
    const cliente = createClienteDto({ nit: '800987654' })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: The NIT is visible in the item
    await waitFor(() => {
      expect(screen.getByTestId('cliente-item-nit')).toHaveTextContent('800987654')
    })
  })

  it('renders the search input with Spanish placeholder', async () => {
    // GIVEN: API returns clients
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: Search input has correct placeholder
    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument()
    })
    expect(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
    ).toBeInTheDocument()
  })

  it('renders skeleton placeholders while data is loading', async () => {
    // GIVEN: API call is delayed
    server.use(
      http.get('/api/v1/clientes', async () => {
        await new Promise((r) => setTimeout(r, 300))
        return HttpResponse.json([])
      }),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: Skeleton placeholders are shown while loading
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filters by Nombre or NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Search filters list by Nombre or NIT/RUC', () => {
  it('filters client list by Nombre — case insensitive', async () => {
    // GIVEN: Two clients loaded from API
    const clientes = [
      createClienteDto({ nombre: 'Empresa Alpha Corp' }),
      createClienteDto({ nombre: 'Beta Industries' }),
    ]
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User types in the search field (lowercase, partial match)
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'alpha corp' },
    })

    // THEN: Only the matching item is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      expect(screen.getByTestId('cliente-item-nombre')).toHaveTextContent('Empresa Alpha Corp')
    })
  })

  it('filters client list by NIT — case insensitive', async () => {
    // GIVEN: Two clients with different NITs
    const clientes = [
      createClienteDto({ nombre: 'Empresa X', nit: '111222333' }),
      createClienteDto({ nombre: 'Empresa Y', nit: '444555666' }),
    ]
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User searches by NIT of first client
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: '111222333' },
    })

    // THEN: Only the client with that NIT is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      expect(screen.getByTestId('cliente-item-nombre')).toHaveTextContent('Empresa X')
    })
  })

  it('shows all clients when search input is cleared', async () => {
    // GIVEN: Two clients loaded and filtered
    const clientes = [
      createClienteDto({ nombre: 'Empresa Uno' }),
      createClienteDto({ nombre: 'Empresa Dos' }),
    ]
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    const searchInput = screen.getByTestId('clientes-search-input')
    fireEvent.change(searchInput, { target: { value: 'Uno' } })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // WHEN: User clears the search input
    fireEvent.change(searchInput, { target: { value: '' } })

    // THEN: All clients appear again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + NFR1 — P0/R-003 — Filter 500 records <1000ms
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 + NFR1 — P0/R-003 — Filter 500 records completes in <1000ms', () => {
  it('filters 500 clients by Nombre in under 1000ms (NFR1)', async () => {
    // GIVEN: 500 clients loaded from API
    const clientes = createClienteDtos(500)
    clientes[249] = createClienteDto({
      ...clientes[249],
      nombre: 'Empresa Buscada Especial',
    })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    })

    // WHEN: User types a search term over 500 records
    const t0 = performance.now()
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'Empresa Buscada Especial' },
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    const elapsed = performance.now() - t0

    // THEN: Filter completes in under 1000ms (NFR1)
    expect(elapsed).toBeLessThan(1000)
  })

  it('filters 500 clients by NIT in under 1000ms (NFR1)', async () => {
    // GIVEN: 500 clients loaded from API
    const clientes = createClienteDtos(500)
    clientes[0] = createClienteDto({
      ...clientes[0],
      nit: 'NIT_UNICO_BUSCADO_999',
    })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    })

    // WHEN: User searches by unique NIT over 500 records
    const t0 = performance.now()
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'NIT_UNICO_BUSCADO_999' },
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    const elapsed = performance.now() - t0

    // THEN: Filter completes in under 1000ms (NFR1)
    expect(elapsed).toBeLessThan(1000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when API returns [] (P1/R-006)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — EmptyState shown when no clients exist (P1/R-006)', () => {
  it('renders empty-state with "No hay clientes registrados" when API returns []', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: EmptyState with CTA is shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'No hay clientes registrados',
    )
  })

  it('does NOT render cliente-list-item when list is empty', async () => {
    // GIVEN: API returns []
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    // THEN: No list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" when fetch fails (P1)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ErrorPanel shown on GET failure (P1)', () => {
  it('renders error-panel when API returns 503', async () => {
    // GIVEN: Backend is unavailable
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 }),
      ),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: ErrorPanel is shown in place of the list
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('renders error-panel with "Reintentar" button', async () => {
    // GIVEN: Backend is unavailable
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 }),
      ),
    )

    // WHEN: ClienteListView is rendered
    renderClienteListView()

    // THEN: A "Reintentar" button is visible
    await waitFor(() => {
      const retryBtn = screen.getByTestId('error-panel-retry')
      expect(retryBtn).toBeInTheDocument()
      expect(retryBtn).toHaveTextContent('Reintentar')
    })
  })

  it('"Reintentar" button triggers a new fetch (P3/R-010)', async () => {
    // GIVEN: First fetch fails, subsequent fetch succeeds
    let callCount = 0
    const cliente = createClienteDto({ nombre: 'Recuperado Corp' })

    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 })
        }
        return HttpResponse.json([cliente])
      }),
    )

    // WHEN: Component renders (fails first)
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // AND: User clicks "Reintentar"
    fireEvent.click(screen.getByTestId('error-panel-retry'))

    // THEN: The list is re-fetched and the client appears
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
      expect(screen.getByTestId('cliente-item-nombre')).toHaveTextContent('Recuperado Corp')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — EmptyState "Sin resultados" when search returns zero matches
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — EmptyState shows "Sin resultados" on zero search matches', () => {
  it('renders "Sin resultados" EmptyState (distinct from no-clients AC3)', async () => {
    // GIVEN: One client exists in the system
    const cliente = createClienteDto({ nombre: 'Empresa Real', nit: '111222333' })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // WHEN: User searches for a non-existing term
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'XYZ_INEXISTENTE_456' },
    })

    // THEN: EmptyState is shown with "Sin resultados" text (not "No hay clientes")
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state')).toHaveTextContent('Sin resultados')
    })
    expect(screen.getByTestId('empty-state')).not.toHaveTextContent(
      'No hay clientes registrados',
    )
  })

  it('does NOT render cliente-list-item when search returns zero matches', async () => {
    // GIVEN: One client exists
    const cliente = createClienteDto({ nombre: 'Solo Cliente' })
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
    )
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // WHEN: Search matches nothing
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'NO_EXISTE_NUNCA' },
    })

    // THEN: No list items visible
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })
  })
})

/**
 * Story 2.1: Client List & Search
 * Component Tests — ClienteListView (Vitest + RTL + MSW) — RED Phase
 *
 * These tests FAIL until ClienteListView.tsx, ClientListItem.tsx,
 * EmptyState.tsx, ErrorPanel.tsx, and useClientes.ts are implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — ClienteListView renders 280px-wide panel with client items (Nombre + NIT)
 *   AC2 — Real-time client-side search (no API re-call — R-004)
 *          TC-E2-P0-03: filter by nombre
 *          TC-E2-P0-04: filter by NIT/RUC
 *   AC3 — EmptyState displayed when API returns [] or filter matches nothing (TC-E2-P1-01)
 *   AC4 — ErrorPanel + Reintentar triggers refetch when API fails (TC-E2-P1-02)
 *
 * Pattern: MSW intercepts every GET /api/v1/clientes call.
 *          Arrange / Act / Assert structure throughout.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// SUT — these modules do not exist yet (RED phase)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — intentional: module will be created during GREEN phase
import { ClienteListView } from '../ClienteListView'

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 1

function buildClienteResponse(overrides?: Partial<{
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}>) {
  const idx = _counter++
  return {
    id: `00000000-0000-7000-0000-${String(idx).padStart(12, '0')}`,
    nombre: `Cliente Test ${idx}`,
    nit: `90010020${idx}-1`,
    telefono: `3001234${String(idx).padStart(3, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function buildClientes(count: number) {
  return Array.from({ length: count }, () => buildClienteResponse())
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })

  render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteListView)
    )
  )

  return { queryClient }
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Panel structure and item rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC1: panel and item rendering', () => {
  it('should render the panel with data-testid="cliente-list-view"', async () => {
    // GIVEN: API returns 2 clients
    const clientes = buildClientes(2)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    // WHEN: Component is rendered
    renderClienteListView()

    // THEN: The list view panel is present
    await waitFor(() => expect(screen.getByTestId('cliente-list-view')).toBeDefined())
  })

  it('should render the search input with data-testid="search-input"', async () => {
    // GIVEN: API returns clients
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(buildClientes(1)))
    )

    // WHEN: Component is rendered
    renderClienteListView()

    // THEN: Search input is present
    await waitFor(() => expect(screen.getByTestId('search-input')).toBeDefined())
  })

  it('should render one data-testid="cliente-item" per client returned', async () => {
    // GIVEN: API returns exactly 5 clients
    const clientes = buildClientes(5)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    // WHEN: Component is rendered and data loads
    renderClienteListView()

    // THEN: 5 client items are in the DOM
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-item')
      expect(items.length).toBe(5)
    })
  })

  it('should display the client nombre (bold) in each client item', async () => {
    // GIVEN: One client with a known nombre
    const cliente = buildClienteResponse({ nombre: 'Empresa Siesa SAS' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([cliente]))
    )

    // WHEN: Component renders
    renderClienteListView()

    // THEN: The nombre is visible in the item
    await waitFor(() => {
      const item = screen.getByTestId('cliente-item')
      expect(within(item).getByText('Empresa Siesa SAS')).toBeDefined()
    })
  })

  it('should display the client NIT in each client item', async () => {
    // GIVEN: One client with a known NIT
    const cliente = buildClienteResponse({ nombre: 'Empresa Test', nit: '900-123-456-7' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([cliente]))
    )

    // WHEN: Component renders
    renderClienteListView()

    // THEN: The NIT is visible in the item
    await waitFor(() => {
      const item = screen.getByTestId('cliente-item')
      expect(within(item).getByText('900-123-456-7')).toBeDefined()
    })
  })

  it('should render skeleton placeholders while loading (isLoading state)', async () => {
    // GIVEN: API is slow to respond
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json([])
      })
    )

    // WHEN: Component is rendered immediately
    renderClienteListView()

    // THEN: Skeleton loading state is visible (via aria-busy or skeleton testid)
    // The component must render skeleton placeholders, not a spinner
    const listView = await screen.findByTestId('cliente-list-view')
    expect(listView).toBeDefined()
    // Check for aria-busy="true" on the list container while loading
    expect(listView.getAttribute('aria-busy') === 'true' ||
      listView.querySelector('[aria-busy="true"]') !== null ||
      document.querySelector('.react-loading-skeleton') !== null
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time client-side search (TC-E2-P0-03 and TC-E2-P0-04)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC2: client-side search filtering', () => {
  it('TC-E2-P0-03 — should filter by nombre without making a new API call', async () => {
    // GIVEN: 10 clients loaded; only one matches "Filtro Especial"
    let apiCallCount = 0
    const clientes = [
      buildClienteResponse({ nombre: 'Empresa Filtro Especial SAS' }),
      ...buildClientes(9),
    ]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        apiCallCount++
        return HttpResponse.json(clientes)
      })
    )

    const user = userEvent.setup()
    renderClienteListView()

    // Wait for all 10 items to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-item').length).toBe(10)
    })

    // WHEN: User types in the search field
    await user.type(screen.getByTestId('search-input'), 'Filtro Especial')

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-item').length).toBe(1)
    })
    expect(screen.getByTestId('cliente-item').textContent).toContain('Filtro Especial')

    // AND: No additional API call was made (R-004 mitigation)
    expect(apiCallCount).toBe(1)
  })

  it('TC-E2-P0-04 — should filter by NIT/RUC without making a new API call', async () => {
    // GIVEN: 10 clients loaded; only one has NIT "999888777"
    let apiCallCount = 0
    const targetNit = '999888777-0'
    const clientes = [
      buildClienteResponse({ nombre: 'Empresa Con NIT Especial', nit: targetNit }),
      ...buildClientes(9),
    ]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        apiCallCount++
        return HttpResponse.json(clientes)
      })
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-item').length).toBe(10)
    })

    // WHEN: User types a partial NIT
    await user.type(screen.getByTestId('search-input'), '999888777')

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-item').length).toBe(1)
    })
    expect(screen.getByTestId('cliente-item').textContent).toContain(targetNit)

    // AND: No additional API call triggered (R-004)
    expect(apiCallCount).toBe(1)
  })

  it('should be case-insensitive when filtering by nombre', async () => {
    // GIVEN: Client named "Empresa Siesa SAS"
    const clientes = [buildClienteResponse({ nombre: 'Empresa Siesa SAS' }), ...buildClientes(2)]
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => expect(screen.getAllByTestId('cliente-item').length).toBe(3))

    // WHEN: User types in lowercase
    await user.type(screen.getByTestId('search-input'), 'empresa siesa')

    // THEN: The match is found (case-insensitive)
    await waitFor(() => expect(screen.getAllByTestId('cliente-item').length).toBe(1))
    expect(screen.getByTestId('cliente-item').textContent).toContain('Empresa Siesa SAS')
  })

  it('should restore full list when search input is cleared', async () => {
    // GIVEN: 5 clients, user has applied a filter
    const clientes = buildClientes(5)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => expect(screen.getAllByTestId('cliente-item').length).toBe(5))
    await user.type(screen.getByTestId('search-input'), 'ZZZNOMATCH')
    await waitFor(() => expect(screen.queryAllByTestId('cliente-item').length).toBe(0))

    // WHEN: User clears the search input
    await user.clear(screen.getByTestId('search-input'))

    // THEN: All 5 items are shown again
    await waitFor(() => expect(screen.getAllByTestId('cliente-item').length).toBe(5))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when API returns [] or filter yields no results
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC3: EmptyState component', () => {
  it('TC-E2-P1-01 — should render data-testid="empty-state" when API returns []', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: Component renders
    renderClienteListView()

    // THEN: EmptyState is visible (R-009)
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeDefined())
  })

  it('should show the default guidance message in EmptyState', async () => {
    // GIVEN: No clients
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    renderClienteListView()

    // THEN: The Spanish guidance message is shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-state').textContent).toContain(
        'Aún no hay clientes registrados'
      )
    })
  })

  it('should render EmptyState when search filter yields zero results', async () => {
    // GIVEN: 3 clients loaded, none matching the search term
    const clientes = buildClientes(3)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => expect(screen.getAllByTestId('cliente-item').length).toBe(3))

    // WHEN: User types a non-matching term
    await user.type(screen.getByTestId('search-input'), 'ZZZNOMATCH')

    // THEN: EmptyState appears, no items shown
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeDefined())
    expect(screen.queryAllByTestId('cliente-item').length).toBe(0)
  })

  it('should NOT render EmptyState when clients are present', async () => {
    // GIVEN: 1 client exists
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([buildClienteResponse()]))
    )

    renderClienteListView()

    await waitFor(() => expect(screen.getByTestId('cliente-item')).toBeDefined())

    // THEN: EmptyState is not shown
    expect(screen.queryByTestId('empty-state')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel + Reintentar triggers refetch
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC4: ErrorPanel and retry behavior', () => {
  it('TC-E2-P1-02 — should render data-testid="error-panel" when API call fails', async () => {
    // GIVEN: API is unavailable
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    // WHEN: Component renders
    renderClienteListView()

    // THEN: ErrorPanel is visible (R-010)
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeDefined())
  })

  it('should display the Spanish error message in ErrorPanel', async () => {
    // GIVEN: API fails
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    renderClienteListView()

    // THEN: Error message is shown in Spanish
    await waitFor(() => {
      expect(screen.getByTestId('error-panel').textContent).toContain(
        'No se pudo cargar la información'
      )
    })
  })

  it('should render data-testid="retry-button" with text "Reintentar"', async () => {
    // GIVEN: API fails
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    renderClienteListView()

    // THEN: Retry button is present
    await waitFor(() => {
      const retryBtn = screen.getByTestId('retry-button')
      expect(retryBtn).toBeDefined()
      expect(retryBtn.textContent).toContain('Reintentar')
    })
  })

  it('TC-E2-P1-02 — clicking "Reintentar" triggers a second GET /api/v1/clientes call', async () => {
    // GIVEN: First call fails, second succeeds
    let callCount = 0
    const clientes = [buildClienteResponse({ nombre: 'Empresa Recuperada SAS' })]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        callCount++
        if (callCount === 1) return HttpResponse.error()
        return HttpResponse.json(clientes)
      })
    )

    const user = userEvent.setup()
    renderClienteListView()

    // Wait for error state
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeDefined())
    expect(callCount).toBe(1)

    // WHEN: User clicks "Reintentar"
    await user.click(screen.getByTestId('retry-button'))

    // THEN: Second API call is made and client list is shown
    await waitFor(() => expect(screen.getByTestId('cliente-item')).toBeDefined())
    expect(callCount).toBe(2)
  })

  it('should NOT show client items when ErrorPanel is active', async () => {
    // GIVEN: API fails
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    renderClienteListView()

    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeDefined())

    // THEN: No client items are rendered
    expect(screen.queryAllByTestId('cliente-item').length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Accessibility (WCAG 2.1 AA)', () => {
  it('search input should have aria-label="Buscar clientes"', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    renderClienteListView()

    await waitFor(() => {
      const input = screen.getByTestId('search-input')
      expect(input.getAttribute('aria-label')).toBe('Buscar clientes')
    })
  })

  it('ErrorPanel container should have role="alert"', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    renderClienteListView()

    await waitFor(() => {
      const errorPanel = screen.getByTestId('error-panel')
      expect(
        errorPanel.getAttribute('role') === 'alert' ||
        errorPanel.querySelector('[role="alert"]') !== null
      ).toBe(true)
    })
  })

  it('client items should have role="button" and tabIndex=0', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([buildClienteResponse()])
      )
    )

    renderClienteListView()

    await waitFor(() => {
      const item = screen.getByTestId('cliente-item')
      expect(item.getAttribute('role')).toBe('button')
      expect(item.getAttribute('tabindex')).toBe('0')
    })
  })
})

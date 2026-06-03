/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Tests — ClienteListView (Vitest + RTL + MSW)
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel shows scrollable list of all clients with Nombre and NIT/RUC
 *   AC2 — Real-time search filters list by Nombre or NIT/RUC in under 1 second
 *   AC3 — EmptyState component when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" when backend is unavailable
 *   AC5 — Default sort is "Más reciente" (newest createdAt first)
 *
 * Test cases:
 *   TC-E2-P1-07 — Real-time search filters by nombre and NIT
 *   TC-E2-P1-08 — EmptyState rendered when GET /api/v1/clientes returns []
 *   TC-E2-P1-09 — ErrorPanel rendered with "Reintentar" when fetch returns 500
 *   TC-E2-P1-14 — Default sort order is "Más reciente" (newest first)
 *   TC-E2-P3-03 — Search keystrokes not dropped (type 5 chars, filter matches)
 *   TC-E2-P3-04 — Search renders in ≤ 150ms with 500 mock records
 *
 * RED phase: These tests fail because:
 *   - ClienteListView does not exist yet at
 *     frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
 *   - useClientes hook does not exist yet
 *   - EmptyState component does not exist yet
 *   - ErrorPanel component does not exist yet
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createCliente, createClientes, createClientesForSortTest } from '../../../../shared/factories/cliente.factory'

// ─── MSW Server ───────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Test Wrapper ─────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ─── Lazy import — will fail (RED) until ClienteListView is implemented ───────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ClienteListView: any

describe('ClienteListView', () => {
  beforeAll(async () => {
    const mod = await import('../ClienteListView')
    ClienteListView = mod.ClienteListView ?? mod.default
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E2-P1-07 — Real-time Search Filters Client List
  // ───────────────────────────────────────────────────────────────────────────

  describe('TC-E2-P1-07 — Real-time search filters by nombre and NIT', () => {
    it('Given 10 clients loaded, When "Banco" is typed, Then only "Banco Nacional" is shown', async () => {
      // GIVEN: MSW returns 10 clients including "Banco Nacional"
      const bancoNacional = createCliente({
        nombre: 'Banco Nacional',
        nit: '800100200-1',
      })
      const otherClientes = createClientes(9, {})
      const mockClientes = [bancoNacional, ...otherClientes]

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
      )

      const wrapper = createWrapper()
      render(
        <ClienteListView onClienteSelect={() => {}} />,
        { wrapper },
      )

      // Wait for list to load
      await waitFor(() => {
        expect(screen.getByTestId('cliente-list')).toBeDefined()
      })

      // WHEN: user types "Banco" in the search field
      const searchInput = screen.getByLabelText('Buscar clientes')
      await userEvent.type(searchInput, 'Banco')

      // THEN: only "Banco Nacional" is visible
      await waitFor(() => {
        expect(screen.getByText('Banco Nacional')).toBeDefined()
        // Other clients should not be visible in filtered list
        const listItems = screen.getAllByTestId('cliente-list-item')
        expect(listItems).toHaveLength(1)
      })
    })

    it('Given search active, When search is cleared, Then all 10 clients are shown again', async () => {
      // GIVEN: 10 clients loaded
      const bancoNacional = createCliente({ nombre: 'Banco Nacional', nit: '800100200-1' })
      const otherClientes = createClientes(9, {})
      const mockClientes = [bancoNacional, ...otherClientes]

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
      )

      const wrapper = createWrapper()
      render(
        <ClienteListView onClienteSelect={() => {}} />,
        { wrapper },
      )

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(10)
      })

      const searchInput = screen.getByLabelText('Buscar clientes')
      await userEvent.type(searchInput, 'Banco')

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      })

      // WHEN: search is cleared
      await userEvent.clear(searchInput)

      // THEN: all 10 clients are visible again
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(10)
      })
    })

    it('Given clients loaded, When a NIT fragment "800100200" is typed, Then "Banco Nacional" is found by NIT', async () => {
      // GIVEN: MSW returns clients including "Banco Nacional" with NIT "800100200-1"
      const bancoNacional = createCliente({ nombre: 'Banco Nacional', nit: '800100200-1' })
      const otherClientes = createClientes(5, {})
      const mockClientes = [bancoNacional, ...otherClientes]

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
      )

      const wrapper = createWrapper()
      render(
        <ClienteListView onClienteSelect={() => {}} />,
        { wrapper },
      )

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0)
      })

      // WHEN: user types a NIT fragment
      const searchInput = screen.getByLabelText('Buscar clientes')
      await userEvent.type(searchInput, '800100200')

      // THEN: "Banco Nacional" is found by NIT match
      await waitFor(() => {
        expect(screen.getByText('Banco Nacional')).toBeDefined()
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      })
    })

    it('Given search active, When typing, Then no additional API calls are triggered', async () => {
      // GIVEN: 10 clients loaded
      let apiCallCount = 0
      server.use(
        http.get('*/api/v1/clientes', () => {
          apiCallCount++
          return HttpResponse.json(createClientes(10, {}))
        }),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0)
      })

      const initialCallCount = apiCallCount

      // WHEN: user types several characters in the search field
      const searchInput = screen.getByLabelText('Buscar clientes')
      await userEvent.type(searchInput, 'test')

      // THEN: no new API calls triggered (client-side filter only)
      expect(apiCallCount).toBe(initialCallCount)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E2-P1-08 — EmptyState Rendered When No Clients Exist
  // ───────────────────────────────────────────────────────────────────────────

  describe('TC-E2-P1-08 — EmptyState when GET /api/v1/clientes returns []', () => {
    it('Given GET /api/v1/clientes returns [], When the page loads, Then EmptyState component is rendered', async () => {
      // GIVEN: backend returns empty array
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json([])),
      )

      const wrapper = createWrapper()

      // WHEN: ClienteListView renders
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      // THEN: EmptyState component is shown
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeDefined()
      })
    })

    it('Given empty list, When EmptyState renders, Then no client list items are shown', async () => {
      // GIVEN: backend returns []
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json([])),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeDefined()
      })

      // THEN: no list items rendered
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    })

    it('Given empty list, When EmptyState renders, Then a message guides user to create first client', async () => {
      // GIVEN: backend returns []
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json([])),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      // THEN: EmptyState shows instructional text
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeDefined()
        // The EmptyState should contain guidance text (title or description)
        const emptyState = screen.getByTestId('empty-state')
        expect(emptyState.textContent).toBeTruthy()
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E2-P1-09 — ErrorPanel Rendered When Backend Is Unavailable
  // ───────────────────────────────────────────────────────────────────────────

  describe('TC-E2-P1-09 — ErrorPanel when GET /api/v1/clientes returns 500', () => {
    it('Given backend returns 500, When the page loads, Then ErrorPanel is rendered', async () => {
      // GIVEN: backend returns a 500 error
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })),
      )

      const wrapper = createWrapper()

      // WHEN: ClienteListView renders
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      // THEN: ErrorPanel is rendered (not a blank screen, not a JS error)
      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeDefined()
      })
    })

    it('Given ErrorPanel rendered, When rendered, Then "Reintentar" button is visible', async () => {
      // GIVEN: backend returns 500
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json({}, { status: 500 })),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeDefined()
      })

      // THEN: "Reintentar" button is present and interactive
      expect(screen.getByText('Reintentar')).toBeDefined()
    })

    it('Given ErrorPanel rendered, When "Reintentar" is clicked, Then a new GET /api/v1/clientes request is made', async () => {
      // GIVEN: backend first returns 500, then returns clients on retry
      let requestCount = 0
      const mockClientes = createClientes(3, {})

      server.use(
        http.get('*/api/v1/clientes', () => {
          requestCount++
          if (requestCount === 1) {
            return HttpResponse.json({}, { status: 500 })
          }
          return HttpResponse.json(mockClientes)
        }),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeDefined()
      })

      // WHEN: user clicks "Reintentar"
      const retryButton = screen.getByText('Reintentar')
      await userEvent.click(retryButton)

      // THEN: a second request is made and clients load
      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(1)
      })
    })

    it('Given backend error, When ErrorPanel renders, Then raw error message is NOT displayed', async () => {
      // GIVEN: backend returns 500 with internal message
      server.use(
        http.get('*/api/v1/clientes', () =>
          HttpResponse.json({ message: 'Connection refused', stack: 'at Server.listen' }, { status: 500 }),
        ),
      )

      const wrapper = createWrapper()
      const { container } = render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeDefined()
      })

      // THEN: no raw error details exposed to the user
      expect(container.textContent).not.toContain('Connection refused')
      expect(container.textContent).not.toContain('at Server.listen')
      expect(container.textContent).not.toContain('stackTrace')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E2-P1-14 — Default Sort Order is "Más reciente"
  // ───────────────────────────────────────────────────────────────────────────

  describe('TC-E2-P1-14 — Default sort is "Más reciente" (newest createdAt first)', () => {
    it('Given clients with different createdAt dates, When rendered with no sort preference, Then newest client appears first', async () => {
      // GIVEN: 3 clients with distinct createdAt dates
      const [oldest, middle, newest] = createClientesForSortTest()
      // Intentionally provide them in unsorted order to the API
      const unsortedClientes = [middle, oldest, newest]

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(unsortedClientes)),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBe(3)
      })

      // THEN: clients are ordered newest first
      const listItems = screen.getAllByTestId('cliente-list-item')
      expect(listItems[0].textContent).toContain(newest.nombre)
      expect(listItems[listItems.length - 1].textContent).toContain(oldest.nombre)
    })

    it('Given clients rendered, When no sort preference is set, Then SortControl shows "Más reciente" as default', async () => {
      // GIVEN: clients loaded
      const mockClientes = createClientes(3, {})
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0)
      })

      // THEN: the sort control has "fecha-desc" (Más reciente) as selected value
      const sortControl = screen.getByTestId('sort-control')
      // The selected option value should be 'fecha-desc'
      expect((sortControl as HTMLSelectElement).value).toBe('fecha-desc')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E2-P3-03 — Search Input Does Not Drop Keystrokes
  // ───────────────────────────────────────────────────────────────────────────

  describe('TC-E2-P3-03 — Search input does not drop keystrokes', () => {
    it('Given 20 clients loaded, When 5 characters are typed rapidly, Then final filter matches the full 5-character term', async () => {
      // GIVEN: 20 mock clients loaded
      const mockClientes = createClientes(20, {})
      // Add a known client that matches "abcde" for assertion
      const targetCliente = createCliente({ nombre: 'abcde Target Corp', nit: '999999999-0' })
      mockClientes.push(targetCliente)

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0)
      })

      // WHEN: user types 5 characters
      const searchInput = screen.getByLabelText('Buscar clientes')
      await userEvent.type(searchInput, 'abcde')

      // THEN: the search input has the full 5-character value (no dropped keystrokes)
      expect((searchInput as HTMLInputElement).value).toBe('abcde')

      // AND: the filter results reflect the full search term
      await waitFor(() => {
        expect(screen.getByText('abcde Target Corp')).toBeDefined()
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TC-E2-P3-04 — Search Renders in ≤ 150ms with 500 Records
  // ───────────────────────────────────────────────────────────────────────────

  describe('TC-E2-P3-04 — Search performance ≤ 150ms with 500 records', () => {
    it('Given 500 clients loaded, When search filter is applied, Then re-render completes in ≤ 150ms', async () => {
      // GIVEN: 500 mock clients in the cache
      const bulk = createClientes(497, {})
      const matchingClientes = [
        createCliente({ nombre: 'Empresa Alfa S.A.', nit: '800000001-1' }),
        createCliente({ nombre: 'Empresa Alfa Beta', nit: '800000002-2' }),
        createCliente({ nombre: 'Empresa Alfa Gamma', nit: '800000003-3' }),
      ]
      const mockClientes = [...bulk, ...matchingClientes]

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBe(500)
      })

      const searchInput = screen.getByLabelText('Buscar clientes')

      // WHEN: a search term is typed and re-render is measured
      const startTime = performance.now()

      await act(async () => {
        await userEvent.type(searchInput, 'Empresa Alfa')
      })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // THEN: re-render completes in ≤ 150ms (NFR1 compliance: < 1s with 500 records)
      expect(renderTime).toBeLessThanOrEqual(150)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // AC1 — List renders with Nombre and NIT visible per item
  // ───────────────────────────────────────────────────────────────────────────

  describe('AC1 — Client list renders Nombre and NIT/RUC per item', () => {
    it('Given clients loaded, When the list renders, Then each item shows Nombre and NIT', async () => {
      // GIVEN: 3 known clients
      const knownCliente = createCliente({
        nombre: 'Empresa Conocida',
        nit: '900111222-3',
      })

      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json([knownCliente])),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      // THEN: nombre and NIT are both visible in the list item
      await waitFor(() => {
        expect(screen.getByText('Empresa Conocida')).toBeDefined()
        expect(screen.getByText('900111222-3')).toBeDefined()
      })
    })

    it('Given clients loaded, When the list renders, Then the search input has the correct placeholder', async () => {
      // GIVEN: at least one client in the list
      server.use(
        http.get('*/api/v1/clientes', () => HttpResponse.json(createClientes(1, {}))),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0)
      })

      // THEN: search input has the correct placeholder
      const searchInput = screen.getByPlaceholderText('Buscar por nombre o NIT/RUC')
      expect(searchInput).toBeDefined()
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Loading state — Skeleton placeholders
  // ───────────────────────────────────────────────────────────────────────────

  describe('Loading state — skeleton placeholders', () => {
    it('Given the list is loading, When ClienteListView is first rendered, Then skeleton placeholders are visible', async () => {
      // GIVEN: MSW delays response to simulate loading state
      server.use(
        http.get('*/api/v1/clientes', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(createClientes(5, {}))
        }),
      )

      const wrapper = createWrapper()
      render(<ClienteListView onClienteSelect={() => {}} />, { wrapper })

      // THEN: loading skeletons are visible before data arrives
      // (skeleton elements visible immediately, before client data loads)
      expect(screen.getByTestId('cliente-list-skeleton')).toBeDefined()
    })
  })
})

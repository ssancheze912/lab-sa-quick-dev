/**
 * Story 2.1: Client List & Search
 * Component Tests — ClienteListView (RED phase)
 *
 * Covers acceptance criteria via TC-E2-P1-01 through TC-E2-P1-06.
 *
 * AC covered:
 *   #1 — Scrollable list renders all clients with Nombre and NIT/RUC
 *   #2 — Real-time search filters by Nombre and NIT/RUC (case-insensitive, < 1 s)
 *   #3 — EmptyState when no clients exist
 *   #4 — ErrorPanel on fetch failure; "Reintentar" triggers refetch and shows list
 *
 * Test IDs:
 *   TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05, TC-E2-P1-06
 *
 * STATUS: RED — ClienteListView, EmptyState, ErrorPanel, ClientListItem do not exist yet.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import type { Cliente } from '../../domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// Mock data factories
// ─────────────────────────────────────────────────────────────────────────────

function createMockCliente(overrides?: Partial<Cliente>): Cliente {
  return {
    id: String(Math.random()),
    nombre: 'Cliente Test',
    nit: '900000001',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

function createMockClienteList(count: number): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCliente({
      id: String(i + 1),
      nombre: `Cliente ${String.fromCharCode(65 + (i % 26))} ${i}`,
      nit: `9${String(i).padStart(8, '0')}`,
    })
  )
}

const TWO_CLIENTS: Cliente[] = [
  createMockCliente({ id: '1', nombre: 'Cliente A', nit: '900111222' }),
  createMockCliente({ id: '2', nombre: 'Cliente B', nit: '900333444' }),
]

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first intercepts registered BEFORE any navigation
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-01: Client list renders all clients with Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-01 — Client list renders all clients with Nombre and NIT/RUC', () => {
  it('should render 2 client items when the API returns 2 clients', async () => {
    // GIVEN: MSW returns 2 clients
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: ClienteListView is rendered
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: 2 list items are visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
    })
  })

  it('should display "Cliente A" as the nombre of the first item', async () => {
    // GIVEN: MSW returns clients with known names
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: "Cliente A" is visible in the list
    await waitFor(() => {
      expect(screen.getByText('Cliente A')).toBeInTheDocument()
    })
  })

  it('should display the NIT/RUC of each client in the list items', async () => {
    // GIVEN: MSW returns 2 clients with known NITs
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: Both NIT values are visible in the DOM
    await waitFor(() => {
      expect(screen.getByText('900111222')).toBeInTheDocument()
      expect(screen.getByText('900333444')).toBeInTheDocument()
    })
  })

  it('should render the list inside a container with data-testid="clientes-list-panel"', async () => {
    // GIVEN: MSW returns clients
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list view renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: The list panel container is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    })
  })

  it('should render a scrollable list element (ul) containing the client items', async () => {
    // GIVEN: MSW returns 2 clients
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: A <ul> element exists with the client items inside
    await waitFor(() => {
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      const items = within(list).getAllByTestId('cliente-list-item')
      expect(items.length).toBeGreaterThanOrEqual(2)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-02: EmptyState when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-02 — EmptyState is displayed when no clients exist', () => {
  it('should render the EmptyState component when the API returns an empty array', async () => {
    // GIVEN: MSW returns [] for GET /api/v1/clientes
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([]))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list view renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: The EmptyState component is rendered
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('should display the guiding message to create the first client', async () => {
    // GIVEN: API returns []
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([]))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list view renders with empty data
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: The Spanish guidance message is present
    await waitFor(() => {
      expect(
        screen.getByText(/no hay clientes.*crea el primero/i)
      ).toBeInTheDocument()
    })
  })

  it('should NOT render any client list items when the list is empty', async () => {
    // GIVEN: API returns []
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([]))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list view renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: No client-list-item elements are rendered
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('should NOT render the EmptyState when there are clients', async () => {
    // GIVEN: API returns 2 clients
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list view renders
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: EmptyState is not present
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
    expect(screen.queryByTestId('empty-state')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-03: ErrorPanel on backend failure + Reintentar triggers refetch
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-03 — ErrorPanel on backend failure with Reintentar button', () => {
  it('should render the ErrorPanel when the API call fails', async () => {
    // GIVEN: MSW returns a network error on first call
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.error())
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list view renders and the fetch fails
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: ErrorPanel is rendered
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('should display a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: API fails
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.error())
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: Error state is rendered
    renderWithProviders(React.createElement(ClienteListView))

    // THEN: The "Reintentar" button is visible
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /reintentar/i })
      ).toBeInTheDocument()
    })
  })

  it('should replace the ErrorPanel with the client list when Reintentar is clicked and refetch succeeds', async () => {
    // GIVEN: First request fails, second request succeeds with 2 clients
    let callCount = 0
    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++
        if (callCount === 1) return HttpResponse.error()
        return HttpResponse.json(TWO_CLIENTS)
      })
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The view is rendered and ErrorPanel appears
    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    // AND WHEN: The user clicks "Reintentar"
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    })

    // THEN: The ErrorPanel is replaced by the client list
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })
    expect(screen.queryByTestId('error-panel')).toBeNull()
  })

  it('should NOT render the ErrorPanel when the API is successful', async () => {
    // GIVEN: API responds successfully
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The view renders
    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // THEN: No ErrorPanel is present
    expect(screen.queryByTestId('error-panel')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-04: Real-time search filters list by Nombre (case-insensitive)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-04 — Real-time search filters by Nombre (case-insensitive)', () => {
  const FIVE_CLIENTS: Cliente[] = [
    createMockCliente({ id: '1', nombre: 'Alpha Corp', nit: '100000001' }),
    createMockCliente({ id: '2', nombre: 'Beta Industries', nit: '100000002' }),
    createMockCliente({ id: '3', nombre: 'Gamma Solutions', nit: '100000003' }),
    createMockCliente({ id: '4', nombre: 'Alpha Ventures', nit: '100000004' }),
    createMockCliente({ id: '5', nombre: 'Delta Group', nit: '100000005' }),
  ]

  it('should show only clients matching the search term when typing in the search field', async () => {
    // GIVEN: 5 clients are loaded (2 contain "alpha" in nombre)
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(FIVE_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The user types "alpha" in the search input
    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5)
    })

    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'alpha' } })
    })

    // THEN: Only 2 items with "Alpha" in nombre are visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items).toHaveLength(2)
    })
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument()
    expect(screen.getByText('Alpha Ventures')).toBeInTheDocument()
    expect(screen.queryByText('Beta Industries')).toBeNull()
  })

  it('should filter case-insensitively (uppercase search matches lowercase nombre)', async () => {
    // GIVEN: Clients loaded, search is case-insensitive per AC#2
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(FIVE_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5)
    })

    // WHEN: User types uppercase "GAMMA"
    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'GAMMA' } })
    })

    // THEN: "Gamma Solutions" is visible (case-insensitive match)
    await waitFor(() => {
      expect(screen.getByText('Gamma Solutions')).toBeInTheDocument()
    })
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
  })

  it('should restore all items when the search field is cleared', async () => {
    // GIVEN: Search has been applied
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(FIVE_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5)
    })

    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'alpha' } })
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2)
    })

    // WHEN: User clears the search field
    act(() => {
      fireEvent.change(searchInput, { target: { value: '' } })
    })

    // THEN: All 5 clients are visible again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5)
    })
  })

  it('should display a no-results message when search matches nothing', async () => {
    // GIVEN: 5 clients loaded, none match "xyz"
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(FIVE_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5)
    })

    // WHEN: User types a term that matches nothing
    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'xyznotfound' } })
    })

    // THEN: A no-results message is shown with the search term
    await waitFor(() => {
      expect(
        screen.getByText(/no se encontró ningún cliente para/i)
      ).toBeInTheDocument()
    })
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05: Real-time search filters by NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-05 — Real-time search filters by NIT/RUC', () => {
  const CLIENTS_FOR_NIT: Cliente[] = [
    createMockCliente({ id: '1', nombre: 'Empresa Uno', nit: '999888777' }),
    createMockCliente({ id: '2', nombre: 'Empresa Dos', nit: '111222333' }),
    createMockCliente({ id: '3', nombre: 'Empresa Tres', nit: '444555666' }),
  ]

  it('should filter clients when the user types a known NIT value', async () => {
    // GIVEN: 3 clients with distinct NITs
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(CLIENTS_FOR_NIT))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The user types the full NIT "999888777"
    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: '999888777' } })
    })

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    expect(screen.getByText('Empresa Uno')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Dos')).toBeNull()
  })

  it('should match partial NIT substrings', async () => {
    // GIVEN: 3 clients with distinct NITs
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(CLIENTS_FOR_NIT))
    )
    const { ClienteListView } = await import('../ClienteListView')

    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    // WHEN: User types partial NIT "999"
    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: '999' } })
    })

    // THEN: Only clients whose NIT contains "999" as a substring are shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })
    expect(screen.getByText('Empresa Uno')).toBeInTheDocument()
  })

  it('should return all clients when search is cleared after NIT filter', async () => {
    // GIVEN: NIT filter active
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(CLIENTS_FOR_NIT))
    )
    const { ClienteListView } = await import('../ClienteListView')

    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })

    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)
    act(() => {
      fireEvent.change(searchInput, { target: { value: '999888777' } })
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    })

    // WHEN: User clears the search
    act(() => {
      fireEvent.change(searchInput, { target: { value: '' } })
    })

    // THEN: All 3 clients are restored
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06: Search performance with 500 records < 1 s (NFR1)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-06 — Search performance with 500 records (NFR1 < 1000ms)', () => {
  it('should filter 500 clients in under 1000ms', async () => {
    // GIVEN: MSW returns 500 generated clients; 10 match the search term "especial"
    const manyClientes = Array.from({ length: 490 }, (_, i) => ({
      id: String(i),
      nombre: `Cliente ${i}`,
      nit: `9${String(i).padStart(8, '0')}`,
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }))
    const specialClientes = Array.from({ length: 10 }, (_, i) => ({
      id: String(500 + i),
      nombre: `Empresa Especial ${i}`,
      nit: `8${String(i).padStart(8, '0')}`,
      telefono: '3001234567',
      ciudad: 'Medellín',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }))
    const allClientes = [...manyClientes, ...specialClientes]

    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(allClientes))
    )
    const { ClienteListView } = await import('../ClienteListView')

    // WHEN: The list is rendered with 500 items
    renderWithProviders(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500)
    })

    const searchInput = screen.getByPlaceholderText(/buscar cliente/i)

    // AND WHEN: User types a search term — measure elapsed time
    const start = performance.now()
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'especial' } })
    })

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item')
      expect(items.length).toBeLessThanOrEqual(10)
    })

    const elapsed = performance.now() - start

    // THEN: The filtering completed in under 1000ms
    expect(elapsed).toBeLessThan(1000)

    // AND THEN: The filtered results contain "Empresa Especial" items
    const visibleItems = screen.getAllByTestId('cliente-list-item')
    expect(visibleItems.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Empresa Especial 0')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Additional: Search field accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Search field — accessibility', () => {
  it('should render a search input with aria-label="Buscar cliente"', async () => {
    // GIVEN: List is rendered with clients
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(TWO_CLIENTS))
    )
    const { ClienteListView } = await import('../ClienteListView')

    renderWithProviders(React.createElement(ClienteListView))

    // THEN: The search input has the correct aria-label in Spanish
    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: /buscar cliente/i })).toBeInTheDocument()
    })
  })
})

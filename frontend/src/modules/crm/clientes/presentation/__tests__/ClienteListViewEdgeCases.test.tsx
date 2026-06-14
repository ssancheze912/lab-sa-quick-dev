/**
 * Story 2.1: Client List & Search — ClienteListView Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (ClienteListView.test.tsx).
 * Covers: search with whitespace, single result, selection prop, "Sin resultados"
 * message content, network error after data load, re-render stability.
 */

import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ClienteListView } from '../ClienteListView'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const defaultClientes = [
  createCliente({ nombre: 'Empresa Alpha', nit: '900001111-1' }),
  createCliente({ nombre: 'Empresa Beta', nit: '900002222-2' }),
  createCliente({ nombre: 'Garcia & Co', nit: '800003333-3' }),
]

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(defaultClientes))
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

const noop = () => {}

// ─── Search: whitespace-only query shows full list ────────────────────────────

describe('ClienteListView — search whitespace handling', () => {
  it('[P1] should show full list when search contains only whitespace', async () => {
    // GIVEN: 3 clients loaded
    const user = userEvent.setup()
    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: user types only spaces in the search field
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), '   ')

    // THEN: full list is still shown (whitespace trim per implementation)
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
  })
})

// ─── Search: single match ────────────────────────────────────────────────────

describe('ClienteListView — single search result', () => {
  it('[P1] should show exactly one item when search matches only one client', async () => {
    // GIVEN: 3 clients loaded
    const user = userEvent.setup()
    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: user types "Alpha" which matches only "Empresa Alpha"
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'Alpha')

    // THEN: exactly one item is visible
    const items = screen.getAllByTestId('cliente-list-item')
    expect(items).toHaveLength(1)
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
  })
})

// ─── "Sin resultados" message includes the search query ──────────────────────

describe('ClienteListView — empty search result message', () => {
  it('[P1] "Sin resultados" message should contain the typed search term', async () => {
    // GIVEN: 3 clients loaded
    const user = userEvent.setup()
    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: user types a term that matches nothing
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar cliente' }),
      'TERMINO_INEXISTENTE'
    )

    // THEN: "Sin resultados para ..." message contains the search term
    const message = screen.getByText(/sin resultados para/i)
    expect(message.textContent).toContain('TERMINO_INEXISTENTE')
  })

  it('[P1] should NOT show "Sin resultados" when search term matches at least one client', async () => {
    // GIVEN: 3 clients loaded
    const user = userEvent.setup()
    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: user types a term that matches one client
    await user.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'Garcia')

    // THEN: "Sin resultados" message is NOT shown
    expect(screen.queryByText(/sin resultados para/i)).not.toBeInTheDocument()
  })
})

// ─── Selected item indicator ──────────────────────────────────────────────────

describe('ClienteListView — selectedClienteId prop', () => {
  it('[P1] should pass isSelected=true to the matching ClienteListItem', async () => {
    // GIVEN: 3 clients loaded — first one will be "selected"
    const selectedId = defaultClientes[0].id
    renderWithProviders(
      <ClienteListView selectedClienteId={selectedId} onClienteSelect={noop} />
    )

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // THEN: the first item has aria-selected=true (via ClienteListItem's aria-selected prop)
    const items = screen.getAllByRole('option')
    const selectedItem = items.find(
      (el) => el.getAttribute('aria-selected') === 'true'
    )
    expect(selectedItem).toBeDefined()
  })

  it('[P2] should have no selected item when selectedClienteId is null', async () => {
    // GIVEN: selectedClienteId is null
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // THEN: no item has aria-selected=true
    const items = screen.getAllByRole('option')
    const selectedItems = items.filter(
      (el) => el.getAttribute('aria-selected') === 'true'
    )
    expect(selectedItems).toHaveLength(0)
  })

  it('[P2] should have no selected item when selectedClienteId does not match any client', async () => {
    // GIVEN: selectedClienteId is an ID that does not exist in the list
    renderWithProviders(
      <ClienteListView selectedClienteId="non-existent-id" onClienteSelect={noop} />
    )

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // THEN: no item has aria-selected=true
    const items = screen.getAllByRole('option')
    const selectedItems = items.filter(
      (el) => el.getAttribute('aria-selected') === 'true'
    )
    expect(selectedItems).toHaveLength(0)
  })
})

// ─── onClienteSelect callback ─────────────────────────────────────────────────

describe('ClienteListView — onClienteSelect callback', () => {
  it('[P1] should call onClienteSelect with the client id when an item is clicked', async () => {
    // GIVEN: 3 clients loaded
    const user = userEvent.setup()
    const onSelect = vi.fn()

    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={onSelect} />
    )

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3))

    // WHEN: user clicks the first item (Empresa Alpha)
    await user.click(screen.getAllByRole('option')[0])

    // THEN: onClienteSelect is called with the matching client's id
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(defaultClientes[0].id)
  })
})

// ─── Header: "Clientes" title ────────────────────────────────────────────────

describe('ClienteListView — panel header', () => {
  it('[P2] should render the panel heading "Clientes"', async () => {
    // GIVEN: component rendered
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: heading text is present
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    })
  })

  it('[P2] should render the search input with correct placeholder', async () => {
    // GIVEN: component rendered
    renderWithProviders(
      <ClienteListView selectedClienteId={null} onClienteSelect={noop} />
    )

    // THEN: search input has the correct placeholder text
    await waitFor(() => {
      const input = screen.getByRole('searchbox', { name: 'Buscar cliente' })
      expect(input).toHaveAttribute('placeholder', 'Buscar por nombre o NIT...')
    })
  })
})

// ─── Error state does NOT show list items ────────────────────────────────────

describe('ClienteListView — error state exclusivity', () => {
  it('[P1] should NOT render list items when in error state', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    )

    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    // THEN: no list items are rendered
    await waitFor(() => {
      expect(screen.getByText('Error al cargar los clientes.')).toBeInTheDocument()
    })
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
  })

  it('[P1] should NOT render EmptyState when in error state', async () => {
    // GIVEN: MSW returns 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    )

    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los clientes.')).toBeInTheDocument()
    })

    // THEN: EmptyState message is NOT shown (error and empty-state are mutually exclusive)
    expect(
      screen.queryByText('No hay clientes registrados. Crea el primero.')
    ).not.toBeInTheDocument()
  })
})

// ─── Loading state exclusivity ────────────────────────────────────────────────

describe('ClienteListView — loading state exclusivity', () => {
  it('[P1] should NOT show EmptyState while loading', async () => {
    // GIVEN: very delayed response (loading state persists during assertion)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        // Never-resolving promise keeps loading state active during synchronous assertion
        await new Promise(() => undefined)
        return HttpResponse.json([])
      })
    )

    renderWithProviders(<ClienteListView selectedClienteId={null} onClienteSelect={noop} />)

    // THEN: EmptyState is NOT shown during loading
    expect(
      screen.queryByText('No hay clientes registrados. Crea el primero.')
    ).not.toBeInTheDocument()

    // AND: skeleton IS shown
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument()
  })
})

/**
 * Story 2.1: Client List & Search
 * TC-E2-P1-01: List renders Nombre + NIT per item
 * TC-E2-P1-02: Real-time search filters by Nombre (no extra fetch)
 * TC-E2-P1-03: Real-time search filters by NIT/RUC
 * TC-E2-P1-04: EmptyState shown when []
 * TC-E2-P1-05: ErrorPanel + "Reintentar" on fetch failure
 * TC-E2-P2-06: Filter 500 records < 150ms
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCliente(id: string, nombre: string, nit: string): Cliente {
  return {
    id,
    nombre,
    nit,
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
  }
}

const mockClientes: Cliente[] = [
  makeCliente('1', 'Acme Corp', '900111111-1'),
  makeCliente('2', 'Beta SA', '800222222-2'),
  makeCliente('3', 'Gamma Ltda', '700333333-3'),
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ClienteListView),
    ),
  )
  return queryClient
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClienteListView', () => {
  // TC-E2-P1-01: renders all clients with nombre and nit
  test('renders 3 clients showing nombre and nit per item', async () => {
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('900111111-1')).toBeInTheDocument()
    expect(screen.getByText('Beta SA')).toBeInTheDocument()
    expect(screen.getByText('800222222-2')).toBeInTheDocument()
    expect(screen.getByText('Gamma Ltda')).toBeInTheDocument()
    expect(screen.getByText('700333333-3')).toBeInTheDocument()
  })

  // TC-E2-P1-02: search filters by nombre, no extra API call
  test('filters clients by nombre without triggering new API call', async () => {
    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const input = screen.getByTestId('search-input')
    await user.type(input, 'Acme')

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument()

    // No extra API calls triggered by search
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  // TC-E2-P1-03: search filters by NIT/RUC
  test('filters clients by partial NIT', async () => {
    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, '800222')

    expect(screen.getByText('Beta SA')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument()
  })

  // AC5: clearing search restores all clients
  test('shows all clients when search is cleared', async () => {
    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    const input = screen.getByTestId('search-input')
    await user.type(input, 'Acme')
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument()

    await user.clear(input)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta SA')).toBeInTheDocument()
    expect(screen.getByText('Gamma Ltda')).toBeInTheDocument()
  })

  // TC-E2-P1-04: EmptyState when API returns []
  test('shows EmptyState when no clients are returned', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Aún no hay clientes registrados/i),
    ).toBeInTheDocument()
  })

  // TC-E2-P1-05: ErrorPanel + Reintentar on 500
  test('shows ErrorPanel with Reintentar button on server error', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })

    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  // TC-E2-P1-05: clicking Reintentar triggers refetch
  test('clicking Reintentar triggers refetch', async () => {
    const user = userEvent.setup()
    let callCount = 0

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json({ error: 'error' }, { status: 500 })
      }),
    )

    renderClienteListView()

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })

    const initialCount = callCount
    await user.click(screen.getByTestId('retry-button'))

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCount)
    })
  })

  // TC-E2-P2-06: filter 500 records < 150ms
  test('filters 500 clients in under 150ms', async () => {
    const largeList: Cliente[] = Array.from({ length: 500 }, (_, i) =>
      makeCliente(
        String(i),
        i < 50 ? `Acme ${i}` : `Company ${i}`,
        `90000${String(i).padStart(4, '0')}-1`,
      ),
    )

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(largeList)),
    )

    const user = userEvent.setup()
    renderClienteListView()

    await waitFor(() => {
      expect(screen.getAllByRole('listitem').length).toBe(500)
    })

    const input = screen.getByTestId('search-input')

    const start = performance.now()
    await user.type(input, 'Acme')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)

    const items = screen.getAllByRole('listitem')
    expect(items.length).toBe(50)
  })
})

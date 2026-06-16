/**
 * Story 2.2: Client Detail View — ClienteDetailView Component Tests
 * Task 3: Vitest + RTL + MSW
 *
 * AC: #1 (success renders fields), #3 (not-found), #6 (ErrorPanel on error), #7 (skeleton loading)
 */
import { describe, it, expect, afterEach, afterAll, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

const mockCliente: Cliente = {
  id: 'abc-123',
  nombre: 'Empresa Alpha',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const API_URL = 'http://localhost:5000'

const server = setupServer(
  http.get(`${API_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === 'abc-123') {
      return HttpResponse.json(mockCliente)
    }
    return HttpResponse.json(
      { status: 404, title: 'Cliente no encontrado', detail: 'No se encontró el cliente solicitado.' },
      { status: 404 }
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui)
  )
}

describe('ClienteDetailView', () => {
  it('AC#7 — renders skeleton placeholders during loading', () => {
    // Arrange / Act
    renderWithQuery(React.createElement(ClienteDetailView, { clienteId: 'abc-123' }))

    // Assert — skeleton loading container is visible immediately
    const loadingContainer = screen.getByTestId('cliente-detail-loading')
    expect(loadingContainer).toBeDefined()
    expect(loadingContainer.getAttribute('aria-busy')).toBe('true')
  })

  it('AC#1 — renders all four fields on success', async () => {
    // Arrange / Act
    renderWithQuery(React.createElement(ClienteDetailView, { clienteId: 'abc-123' }))

    // Assert — fields appear after data loads
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeDefined()
    })

    expect(screen.getByText('Nombre')).toBeDefined()
    expect(screen.getByText('Empresa Alpha')).toBeDefined()
    expect(screen.getByText('NIT/RUC')).toBeDefined()
    expect(screen.getByText('900123456-1')).toBeDefined()
    expect(screen.getByText('Teléfono')).toBeDefined()
    expect(screen.getByText('3001234567')).toBeDefined()
    expect(screen.getByText('Ciudad')).toBeDefined()
    expect(screen.getByText('Bogotá')).toBeDefined()
  })

  it('AC#6 — renders ErrorPanel when fetch fails (non-404 error)', async () => {
    // Arrange
    server.use(
      http.get(`${API_URL}/api/v1/clientes/:id`, () => HttpResponse.error())
    )

    // Act
    renderWithQuery(React.createElement(ClienteDetailView, { clienteId: 'abc-123' }))

    // Assert — ErrorPanel appears, no raw error message
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-error')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDefined()
    })
  })

  it('AC#3 — renders not-found message when fetch returns 404', async () => {
    // Arrange / Act
    renderWithQuery(React.createElement(ClienteDetailView, { clienteId: 'nonexistent-id' }))

    // Assert — graceful not-found message in Spanish
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeDefined()
      expect(screen.getByText('No se encontró el cliente solicitado.')).toBeDefined()
    })
  })
})

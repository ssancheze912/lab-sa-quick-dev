/**
 * Story 2.1: Client List & Search — ClienteListView Component Tests
 * Task 3: Vitest + RTL + MSW
 *
 * AC: #1 (panel renders), #2 (filter behavior), #3 (EmptyState), #4 (ErrorPanel), #6 (no-results inline)
 */
import { describe, it, expect, afterEach, afterAll, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Empresa Alpha',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'Empresa Beta',
    nit: '800654321-2',
    telefono: '3007654321',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

const API_URL = 'http://localhost:5000'

const server = setupServer(
  http.get(`${API_URL}/api/v1/clientes`, () => {
    return HttpResponse.json(mockClientes)
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

describe('ClienteListView', () => {
  it('AC#1 — renders panel with title and client list', async () => {
    // Arrange / Act
    renderWithQuery(React.createElement(ClienteListView))

    // Assert — panel title
    expect(screen.getByText('Clientes')).toBeDefined()

    // Assert — client items appear
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeDefined()
      expect(screen.getByText('Empresa Beta')).toBeDefined()
    })
  })

  it('AC#3 — renders EmptyState when API returns empty array', async () => {
    // Arrange
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // Act
    renderWithQuery(React.createElement(ClienteListView))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('No hay clientes registrados. Crea el primero.')).toBeDefined()
    })
  })

  it('AC#4 — renders ErrorPanel when API fails', async () => {
    // Arrange
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.error())
    )

    // Act
    renderWithQuery(React.createElement(ClienteListView))

    // Assert — error message in Spanish, no raw error
    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista de clientes.')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDefined()
    })
  })

  it('AC#2 — filters list client-side on search input', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithQuery(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeDefined()
    })

    // Act — type in search field
    const input = screen.getByRole('searchbox', { name: 'Buscar clientes' })
    await user.type(input, 'Alpha')

    // Assert — only matching item visible
    expect(screen.getByText('Empresa Alpha')).toBeDefined()
    expect(screen.queryByText('Empresa Beta')).toBeNull()
  })

  it('AC#6 — shows inline no-results message when filter yields empty', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithQuery(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeDefined()
    })

    // Act — type a query that matches nothing
    const input = screen.getByRole('searchbox', { name: 'Buscar clientes' })
    await user.type(input, 'ZZZNOMATCH')

    // Assert — inline message, NOT EmptyState
    await waitFor(() => {
      expect(screen.getByText(/Sin resultados para/)).toBeDefined()
      expect(screen.queryByText('No hay clientes registrados. Crea el primero.')).toBeNull()
    })
  })

  it('AC#2 — filters are case-insensitive', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithQuery(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha')).toBeDefined()
    })

    // Act — lowercase search
    const input = screen.getByRole('searchbox', { name: 'Buscar clientes' })
    await user.type(input, 'alpha')

    // Assert
    expect(screen.getByText('Empresa Alpha')).toBeDefined()
    expect(screen.queryByText('Empresa Beta')).toBeNull()
  })

  it('AC#2 — filters by NIT', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithQuery(React.createElement(ClienteListView))

    await waitFor(() => {
      expect(screen.getByText('Empresa Beta')).toBeDefined()
    })

    // Act — search by NIT
    const input = screen.getByRole('searchbox', { name: 'Buscar clientes' })
    await user.type(input, '800654321')

    // Assert — only Beta matches by NIT
    expect(screen.getByText('Empresa Beta')).toBeDefined()
    expect(screen.queryByText('Empresa Alpha')).toBeNull()
  })
})

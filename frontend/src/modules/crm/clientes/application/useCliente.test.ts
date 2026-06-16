/**
 * Story 2.2: Client Detail View — useCliente Hook Tests
 * Task 2: TanStack Query hook with MSW
 */
import { describe, it, expect, afterEach, afterAll, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { useCliente } from './useCliente'
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
      { status: 404, title: 'Cliente no encontrado' },
      { status: 404 }
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCliente', () => {
  it('returns single Cliente object on success', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('abc-123'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCliente)
    expect(result.current.data?.nombre).toBe('Empresa Alpha')
  })

  it('triggers isError when API returns 404', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('nonexistent-id'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('does not fire query when clienteId is undefined', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(undefined), { wrapper })

    // Assert — query stays in pending/idle state (not loading, not error, no data)
    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})

/**
 * Story 2.1: Client List & Search — useClientes Hook Tests
 * Task 2: TanStack Query hook with MSW
 */
import { describe, it, expect, afterEach, afterAll, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { useClientes } from './useClientes'
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useClientes', () => {
  it('returns array of clientes on success', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useClientes(), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].nombre).toBe('Empresa Alpha')
  })

  it('triggers isError state when API fails', async () => {
    // Arrange
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => {
        return HttpResponse.error()
      })
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useClientes(), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { server } from '../../../../test/msw-server'
import { useClientes } from './useClientes'
import type { Cliente } from '../domain/Cliente'

const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Empresa ABC',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useClientes', () => {
  it('returns data when fetch succeeds', async () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    )

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockClientes)
  })

  it('shows loading state initially', () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    )

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns error state when fetch fails', async () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () =>
        HttpResponse.error(),
      ),
    )

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { server } from '../../../../test/msw-server'
import { useCliente } from './useCliente'
import type { Cliente } from '../domain/Cliente'

const mockCliente: Cliente = {
  id: 'test-id-123',
  nombre: 'Empresa ABC',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCliente', () => {
  it('shows loading state initially', () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/:id', () =>
        HttpResponse.json(mockCliente),
      ),
    )

    const { result } = renderHook(() => useCliente('test-id-123'), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns cliente data on success', async () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/:id', () =>
        HttpResponse.json(mockCliente),
      ),
    )

    const { result } = renderHook(() => useCliente('test-id-123'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCliente)
  })

  it('returns isError=true when API returns 404', async () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'Not Found' }, { status: 404 }),
      ),
    )

    const { result } = renderHook(() => useCliente('non-existent-id'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

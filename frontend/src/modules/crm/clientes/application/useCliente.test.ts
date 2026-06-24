import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCliente } from './useCliente'
import type { Cliente } from '../domain/Cliente'

const mockCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === '11111111-1111-1111-1111-111111111111') {
      return HttpResponse.json(mockCliente)
    }
    return new HttpResponse(null, { status: 404 })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCliente', () => {
  it('returns client data when the API fetch succeeds', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nombre).toBe('Empresa Test')
    expect(result.current.data?.nit).toBe('900123456-1')
  })

  it('uses the canonical query key ["clientes", id]', async () => {
    // Arrange
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })

    // Assert — query key is set to ['clientes', id]
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const queryCache = queryClient.getQueryCache()
    const queries = queryCache.findAll({ queryKey: ['clientes', '11111111-1111-1111-1111-111111111111'] })
    expect(queries).toHaveLength(1)
  })

  it('returns isLoading=true while the fetch is in-flight', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })

    // Assert — initial state should be loading
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('returns isError=true when the API returns a 500 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('exposes a refetch function when the fetch fails', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      }),
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Assert
    expect(typeof result.current.refetch).toBe('function')
  })

  it('returns isError=true when the API returns a 404', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 404 })
      }),
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('99999999-9999-9999-9999-999999999999'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does NOT fetch when id is undefined (query disabled)', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(undefined), { wrapper })

    // Assert
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does NOT fetch when id is an empty string (query disabled)', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(''), { wrapper })

    // Assert
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})

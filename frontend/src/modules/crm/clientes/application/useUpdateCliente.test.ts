import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { FC, ReactNode } from 'react'
import { useUpdateCliente } from './useUpdateCliente'
import type { Cliente } from '../domain/Cliente'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}))

const updatedCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Actualizada',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
}

const server = setupServer(
  http.put('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === '11111111-1111-1111-1111-111111111111') {
      return HttpResponse.json(updatedCliente, { status: 200 })
    }
    return HttpResponse.json(
      { status: 404, title: 'Not Found', detail: 'Cliente not found.' },
      { status: 404 },
    )
  }),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper: FC<{ children: ReactNode }> = ({ children }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, queryClient }
}

describe('useUpdateCliente', () => {
  it('calls toast.success and invalidates queries on successful update', async () => {
    // Arrange
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({
        id: '11111111-1111-1111-1111-111111111111',
        data: {
          nombre: 'Empresa Actualizada',
          nit: '900123456-1',
          telefono: '3001234567',
          ciudad: 'Medellín',
        },
      })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente actualizado correctamente')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['clientes', '11111111-1111-1111-1111-111111111111'],
    })
  })

  it('calls toast.error with NIT message on 409 conflict', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        )
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({
        id: '11111111-1111-1111-1111-111111111111',
        data: {
          nombre: 'Empresa Alpha',
          nit: '900000000-1',
          telefono: '3001234567',
          ciudad: 'Bogotá',
        },
      })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mockToastError).toHaveBeenCalledWith('El NIT/RUC ya está registrado')
  })

  it('calls toast.error with generic message on non-409 error', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({
        id: '11111111-1111-1111-1111-111111111111',
        data: {
          nombre: 'Empresa Alpha',
          nit: '900123456-1',
          telefono: '3001234567',
          ciudad: 'Bogotá',
        },
      })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
  })

  it('exposes isPending true while mutation is in-flight', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(updatedCliente, { status: 200 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({
        id: '11111111-1111-1111-1111-111111111111',
        data: {
          nombre: 'Empresa Alpha',
          nit: '900123456-1',
          telefono: '3001234567',
          ciudad: 'Bogotá',
        },
      })
    })

    // Assert — isPending is true immediately
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })
  })
})

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { FC, ReactNode } from 'react'
import { useDeleteCliente } from './useDeleteCliente'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}))

const server = setupServer(
  http.delete('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === '11111111-1111-1111-1111-111111111111') {
      return new HttpResponse(null, { status: 204 })
    }
    return new HttpResponse(
      JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente ${params.id} not found.` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
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

describe('useDeleteCliente', () => {
  it('calls invalidateQueries for clientes on successful delete (204)', async () => {
    // Arrange
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: '11111111-1111-1111-1111-111111111111' })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['contactos'] })
  })

  it('calls toast.success with generic message when client has no contacts', async () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: '11111111-1111-1111-1111-111111111111', hasContacts: false })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente eliminado correctamente')
  })

  it('calls toast.success with contacts-aware message when hasContacts is true', async () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: '11111111-1111-1111-1111-111111111111', hasContacts: true })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
    )
  })

  it('calls toast.error with generic message on 404 error', async () => {
    // Arrange
    const nonExistentId = '99999999-9999-9999-9999-999999999999'
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: nonExistentId })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
  })

  it('calls toast.error with generic message on 500 server error', async () => {
    // Arrange
    server.use(
      http.delete('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: '11111111-1111-1111-1111-111111111111' })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
  })

  it('exposes isPending true while mutation is in-flight', async () => {
    // Arrange
    server.use(
      http.delete('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: '11111111-1111-1111-1111-111111111111' })
    })

    // Assert — isPending is true immediately
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })
  })
})

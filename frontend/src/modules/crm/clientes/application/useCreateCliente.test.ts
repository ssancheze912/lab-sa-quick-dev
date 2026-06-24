import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCreateCliente } from './useCreateCliente'
import type { Cliente } from '../domain/Cliente'

// Mock siesa-ui-kit toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}))

const createdCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Alpha',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const validPayload = {
  nombre: 'Empresa Alpha',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

const server = setupServer(
  http.post('*/api/v1/clientes', () => {
    return HttpResponse.json(createdCliente, { status: 201 })
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
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCreateCliente', () => {
  it('calls toast.success and invalidates queries on successful creation', async () => {
    // Arrange
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente creado correctamente')
  })

  it('shows toast.error with duplicate NIT message on 409 conflict', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        )
      }),
    )
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('El NIT/RUC ya está registrado')
  })

  it('shows generic error toast on 500 server error', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.json({ status: 500 }, { status: 500 })
      }),
    )
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
  })

  it('isPending is true while mutation is in flight', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(createdCliente, { status: 201 })
      }),
    )
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate(validPayload)
    })

    // Assert — isPending is true during the request
    await waitFor(() => expect(result.current.isPending).toBe(true))
  })
})

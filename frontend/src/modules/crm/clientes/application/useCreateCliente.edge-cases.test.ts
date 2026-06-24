import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCreateCliente } from './useCreateCliente'
import type { Cliente } from '../domain/Cliente'

/**
 * Edge-case tests for useCreateCliente hook — Story 2.3: Create Client
 * Expands coverage beyond the happy-path tests in useCreateCliente.test.ts.
 * Covers: query invalidation call, 401/403 → generic toast, network failure,
 * mutation data shape, 400 Bad Request, isPending transitions.
 */

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}))

// Spy on useQueryClient.invalidateQueries via the module-level mock
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

const createdCliente: Cliente = {
  id: '22222222-2222-2222-2222-222222222222',
  nombre: 'Empresa Beta',
  nit: '800111222-2',
  telefono: '3109998888',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const validPayload = {
  nombre: 'Empresa Beta',
  nit: '800111222-2',
  telefono: '3109998888',
  ciudad: 'Medellín',
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
  // Note: useQueryClient is mocked above, so the QueryClient here is mostly structural
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCreateCliente — query invalidation', () => {
  it('calls invalidateQueries with queryKey ["clientes"] on successful creation', async () => {
    // Arrange
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['clientes'] })
  })

  it('does NOT call invalidateQueries when the mutation fails', async () => {
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
    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })
})

describe('useCreateCliente — error path coverage', () => {
  it('shows generic error toast when backend returns 401 Unauthorized', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 })
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
    // Must NOT show the NIT conflict message for 401
    expect(mockToastError).not.toHaveBeenCalledWith('El NIT/RUC ya está registrado')
  })

  it('shows generic error toast when backend returns 403 Forbidden', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.json({ status: 403, title: 'Forbidden' }, { status: 403 })
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

  it('shows generic error toast when backend returns 400 Bad Request', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.json(
          { status: 400, title: 'Validation failed', errors: { nombre: ['El nombre es requerido'] } },
          { status: 400 },
        )
      }),
    )
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert — 400 is not 409, so the generic toast is shown
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
  })

  it('shows generic error toast on network failure (no response)', async () => {
    // Arrange — server returns a network error (no HTTP response)
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.error()
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
})

describe('useCreateCliente — success data shape', () => {
  it('mutation data is the created Cliente DTO returned by the API on success', async () => {
    // Arrange
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({
      id: createdCliente.id,
      nombre: createdCliente.nombre,
      nit: createdCliente.nit,
    })
  })

  it('toast.success is called exactly once per successful mutation', async () => {
    // Arrange
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockToastSuccess).toHaveBeenCalledOnce()
  })

  it('toast.error is NOT called on successful creation', async () => {
    // Arrange
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // Act
    await act(async () => {
      result.current.mutate(validPayload)
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockToastError).not.toHaveBeenCalled()
  })
})

describe('useCreateCliente — isPending state transitions', () => {
  it('isPending transitions from false → true → false during a successful mutation', async () => {
    // Arrange
    const states: boolean[] = []
    server.use(
      http.post('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(createdCliente, { status: 201 })
      }),
    )
    const wrapper = createWrapper()
    const { result } = renderHook(() => {
      const mutation = useCreateCliente()
      states.push(mutation.isPending)
      return mutation
    }, { wrapper })

    // Initial state: not pending
    expect(result.current.isPending).toBe(false)

    // Act — trigger mutation
    act(() => {
      result.current.mutate(validPayload)
    })

    // Wait for pending state
    await waitFor(() => expect(result.current.isPending).toBe(true))

    // Wait for resolution
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
  })
})

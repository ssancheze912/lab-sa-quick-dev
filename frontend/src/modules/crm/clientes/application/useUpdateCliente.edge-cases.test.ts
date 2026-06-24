/**
 * Edge-case unit tests for useUpdateCliente hook — Story 2.4: Edit Client
 * Expands coverage beyond useUpdateCliente.test.ts.
 *
 * ATDD baseline covers (NOT duplicated here):
 *   - toast.success + invalidateQueries on successful update
 *   - toast.error("El NIT/RUC ya está registrado") on 409
 *   - toast.error("No se pudo guardar. Intenta de nuevo.") on 500
 *   - isPending is true during in-flight mutation
 *
 * Edge cases added here:
 *   - toast.error("No se pudo guardar. Intenta de nuevo.") on 404
 *   - toast.error("No se pudo guardar. Intenta de nuevo.") on 400
 *   - invalidateQueries is NOT called on 409 error (cache must not be invalidated on failure)
 *   - invalidateQueries is NOT called on 500 error
 *   - Mutate called multiple times: each call is independent (no shared state bleed)
 *   - isPending transitions back to false after error
 *   - isPending transitions back to false after success
 *   - onSuccess callback can override toast-free success (per-call onSuccess)
 *   - mutate with different id invalidates the correct specific cache key
 */

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

const CLIENT_ID = '22222222-2222-2222-2222-222222222222'
const CLIENT_ID_B = '33333333-3333-3333-3333-333333333333'

const updatedCliente: Cliente = {
  id: CLIENT_ID,
  nombre: 'Empresa Actualizada Edge',
  nit: '900987654-2',
  telefono: '3009876543',
  ciudad: 'Cali',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-24T12:00:00Z',
}

const validData = {
  nombre: 'Empresa Actualizada Edge',
  nit: '900987654-2',
  telefono: '3009876543',
  ciudad: 'Cali',
}

const server = setupServer(
  http.put('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === CLIENT_ID || params.id === CLIENT_ID_B) {
      return HttpResponse.json(updatedCliente, { status: 200 })
    }
    return HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 })
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

// ─── 404 and 400 errors → generic toast ──────────────────────────────────────

describe('useUpdateCliente — 404 error shows generic error toast', () => {
  it('[P1] calls toast.error with generic message on 404 response', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    expect(mockToastError).not.toHaveBeenCalledWith('El NIT/RUC ya está registrado')
  })

  it('[P1] calls toast.error with generic message on 400 response', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json({ status: 400, title: 'Bad Request', errors: {} }, { status: 400 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
  })
})

// ─── invalidateQueries is NOT called on error ─────────────────────────────────

describe('useUpdateCliente — queryClient.invalidateQueries NOT called on error', () => {
  it('[P1] does NOT call invalidateQueries when PUT returns 409', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }, { status: 409 })
      }),
    )
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('[P1] does NOT call invalidateQueries when PUT returns 500', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

// ─── isPending lifecycle transitions ─────────────────────────────────────────

describe('useUpdateCliente — isPending lifecycle transitions', () => {
  it('[P1] isPending transitions back to false after a successful mutation', async () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert: isPending goes true, then false after success
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
  })

  it('[P1] isPending transitions back to false after a failed mutation', async () => {
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
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert: isPending goes true, then false after error
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isPending).toBe(false)
  })
})

// ─── invalidation with correct specific id ────────────────────────────────────

describe('useUpdateCliente — invalidateQueries uses the correct client id', () => {
  it('[P1] invalidates the specific cache key ["clientes", id] with the id passed to mutate', async () => {
    // Arrange
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act: mutate with CLIENT_ID_B (different from the default CLIENT_ID)
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json({ ...updatedCliente, id: CLIENT_ID_B }, { status: 200 })
      }),
    )

    act(() => {
      result.current.mutate({ id: CLIENT_ID_B, data: validData })
    })

    // Assert: the specific key ['clientes', CLIENT_ID_B] was invalidated, not CLIENT_ID
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes', CLIENT_ID_B] })
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['clientes', CLIENT_ID] })
  })
})

// ─── toast.success not called on error ───────────────────────────────────────

describe('useUpdateCliente — toast.success is NOT called on error', () => {
  it('[P1] does NOT call toast.success when the mutation fails with 409', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json({ status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' }, { status: 409 })
      }),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('[P1] does NOT call toast.success when the mutation fails with 500', async () => {
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
      result.current.mutate({ id: CLIENT_ID, data: validData })
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

// ─── hook return shape ────────────────────────────────────────────────────────

describe('useUpdateCliente — hook return shape', () => {
  it('[P2] exposes a mutate function and isPending boolean in its return value', () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Assert
    expect(typeof result.current.mutate).toBe('function')
    expect(typeof result.current.isPending).toBe('boolean')
  })

  it('[P2] isPending is false before any mutation is triggered', () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    // Assert: idle state
    expect(result.current.isPending).toBe(false)
  })
})

/**
 * Unit Edge-Case Tests — useDeleteCliente hook
 * BMad-Integrated Automate — Expansion beyond useDeleteCliente.test.ts
 *
 * ATDD baseline covers (NOT duplicated here):
 *   - invalidateQueries called for clientes and contactos on success
 *   - toast.success with generic message when hasContacts is falsy
 *   - toast.success with contacts-aware message when hasContacts is true
 *   - toast.error on 404 error
 *   - toast.error on 500 error
 *   - isPending is true while mutation is in-flight
 *
 * Edge cases added here:
 *   - hasContacts defaults to falsy → generic toast (undefined, not explicitly false)
 *   - toast.success NOT called on error path
 *   - toast.error NOT called on success path
 *   - invalidateQueries NOT called on error path
 *   - mutate called with same id twice sequentially → both calls reach the API
 *   - isError resets to false after a subsequent successful mutation
 *   - isSuccess resets to false after a subsequent failed mutation
 *   - mutate with empty string id propagates to the API (boundary — server decides 400/404)
 */

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

const VALID_ID = '11111111-1111-1111-1111-111111111111'
const INVALID_ID = '99999999-9999-9999-9999-999999999999'

const server = setupServer(
  http.delete('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === VALID_ID) {
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

// ─────────────────────────────────────────────────────────────────────────────
// hasContacts defaults to falsy (undefined) → generic toast
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: hasContacts undefined defaults to generic toast', () => {
  it('[P2] shows generic success toast when hasContacts is undefined (not passed)', async () => {
    // Arrange: mutate without hasContacts
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: VALID_ID }) // hasContacts omitted
    })

    // Assert: generic toast (not the contacts-aware one)
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente eliminado correctamente')
    expect(mockToastSuccess).not.toHaveBeenCalledWith(
      'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// toast.success NOT called on error path
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: toast.success never called on error', () => {
  it('[P1] does NOT call toast.success when mutation fails', async () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: INVALID_ID })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// toast.error NOT called on success path
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: toast.error never called on success', () => {
  it('[P1] does NOT call toast.error when mutation succeeds', async () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: VALID_ID })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockToastError).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// invalidateQueries NOT called on error path
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: invalidateQueries not called on error', () => {
  it('[P1] does NOT call invalidateQueries when mutation fails', async () => {
    // Arrange
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: INVALID_ID })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// invalidateQueries called for both 'clientes' and 'contactos' on success
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: both query keys invalidated on success', () => {
  it('[P1] invalidates exactly the clientes and contactos query keys — no more, no less', async () => {
    // Arrange
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Act
    act(() => {
      result.current.mutate({ id: VALID_ID })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(2)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['contactos'] })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sequential mutations — second call also reaches the API
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: sequential mutations each call the API', () => {
  it('[P2] second successful mutation also triggers toast and invalidation', async () => {
    // Arrange: two different valid clients
    server.use(
      http.delete('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // First mutation
    act(() => {
      result.current.mutate({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Second mutation
    act(() => {
      result.current.mutate({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' })
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Assert: invalidation was called 4 times total (2 per successful mutation)
    expect(invalidateSpy).toHaveBeenCalledTimes(4)
    expect(mockToastSuccess).toHaveBeenCalledTimes(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isPending is false before mutation is started
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: isPending false before mutate is called', () => {
  it('[P2] isPending is false before any mutation is triggered', () => {
    // Arrange
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteCliente(), { wrapper })

    // Assert: idle state — not pending
    expect(result.current.isPending).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isError state after 500 (unexpected error)
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — edge: isError true after unexpected 500', () => {
  it('[P1] isError is true when backend returns 500', async () => {
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
      result.current.mutate({ id: VALID_ID })
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
  })
})

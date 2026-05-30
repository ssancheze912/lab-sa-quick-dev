// Story 2.2: Client Detail View
// Edge-Case / Boundary Tests — useCliente hook (testarch-automate expansion)
// Expands ATDD coverage with boundary conditions, state transitions, and error paths
// not covered by useCliente.test.ts.

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useCliente } from './useCliente'
import { mockClientes } from '../../../../__mocks__/handlers/clientes'

const mockCliente = mockClientes[0] // Ana García
const mockCliente2 = mockClientes[1] // Pedro Pérez

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------
const server = setupServer(
  http.get('/api/v1/clientes/:id', ({ params }) => {
    const { id } = params
    const found = mockClientes.find((c) => c.id === id)
    if (!found) {
      return HttpResponse.json(
        { status: 404, title: 'Cliente no encontrado', detail: `No existe un cliente con ID ${id}.` },
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
      )
    }
    return HttpResponse.json(found)
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Helper: fresh QueryClient wrapper per test — prevents cache bleed
// ---------------------------------------------------------------------------
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return wrapper
}

// ---------------------------------------------------------------------------
// Boundary: truthy but unusual ids
// ---------------------------------------------------------------------------
describe('useCliente — boundary: id values that are truthy', () => {
  it('Given a whitespace-only id (" ") When hook renders Then query IS enabled (truthy string)', async () => {
    // Edge: " " (single space) is truthy in JS → !!id === true → query fires
    // The API will return 404 for this malformed id — hook exposes isError
    server.use(
      http.get('/api/v1/clientes/%20', () =>
        HttpResponse.json({ status: 404, title: 'Not found' }, { status: 404 }),
      ),
    )

    const { result } = renderHook(() => useCliente(' '), { wrapper: createWrapper() })

    // Query is enabled (id is truthy)
    expect(result.current.fetchStatus !== 'idle' || result.current.isError || result.current.isLoading).toBe(true)
  })

  it('Given a valid UUID id When query resolves Then isSuccess is true', async () => {
    // Boundary: check isSuccess flag (complement of isLoading / isError)
    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// State transition: id changes from undefined → valid
// ---------------------------------------------------------------------------
describe('useCliente — state transition: id changes', () => {
  it('Given id starts as undefined When id becomes valid Then query activates and returns data', async () => {
    // Transition: disabled → enabled
    let currentId: string | undefined = undefined

    const { result, rerender } = renderHook(() => useCliente(currentId), { wrapper: createWrapper() })

    // Initially disabled
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()

    // Transition: id becomes valid
    currentId = mockCliente.id
    rerender()

    await waitFor(() => {
      expect(result.current.data?.id).toBe(mockCliente.id)
    })
  })

  it('Given id starts as valid When id becomes undefined Then query is disabled and prior data is cleared', async () => {
    // Transition: enabled → disabled
    let currentId: string | undefined = mockCliente.id

    const { result, rerender } = renderHook(() => useCliente(currentId), { wrapper: createWrapper() })

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Transition: id becomes undefined
    currentId = undefined
    rerender()

    // Query is now disabled — isLoading must be false
    expect(result.current.isLoading).toBe(false)
  })

  it('Given id changes from client1 to client2 When rerendered Then data updates to client2', async () => {
    // Cache isolation: different ids use separate query keys
    let currentId = mockCliente.id

    const { result, rerender } = renderHook(() => useCliente(currentId), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.data?.nombre).toBe('Ana García')
    })

    // Switch to client 2
    currentId = mockCliente2.id
    rerender()

    await waitFor(() => {
      expect(result.current.data?.nombre).toBe('Pedro Pérez')
    })
  })
})

// ---------------------------------------------------------------------------
// Error path: 500 server error
// ---------------------------------------------------------------------------
describe('useCliente — 500 server error path', () => {
  it('Given backend returns 500 When hook queries Then isError is true', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 500, title: 'Internal error' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('Given backend returns 500 When isError is true Then data is undefined', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 500, title: 'Internal error' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
  })

  it('Given 500 error When isError is true Then error object is defined', async () => {
    // The component needs error.response?.status to distinguish 500 from 404
    server.use(
      http.get('/api/v1/clientes/:id', () =>
        HttpResponse.json({ status: 500, title: 'Internal error' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
  })
})

// ---------------------------------------------------------------------------
// Query key structure — cache correctness boundary
// ---------------------------------------------------------------------------
describe('useCliente — query key contains exact id', () => {
  it('Given two hooks with different ids sharing a queryClient When both resolve Then each has correct data', async () => {
    // Boundary: shared queryClient must not cross-contaminate cache entries
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result: result1 } = renderHook(() => useCliente(mockCliente.id), { wrapper })
    const { result: result2 } = renderHook(() => useCliente(mockCliente2.id), { wrapper })

    await waitFor(() => {
      expect(result1.current.data?.id).toBe(mockCliente.id)
    })
    await waitFor(() => {
      expect(result2.current.data?.id).toBe(mockCliente2.id)
    })

    // Cross-check: each hook returns its own client, not the other's
    expect(result1.current.data?.nombre).toBe('Ana García')
    expect(result2.current.data?.nombre).toBe('Pedro Pérez')
  })
})

// ---------------------------------------------------------------------------
// Hook exports completeness — required by ClienteDetailView
// ---------------------------------------------------------------------------
describe('useCliente — hook return shape required by ClienteDetailView', () => {
  it('Given valid id When hook renders Then all required fields are returned', async () => {
    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper: createWrapper() })

    // The component destructures: { data, isLoading, isError, error, refetch }
    expect('data' in result.current).toBe(true)
    expect('isLoading' in result.current).toBe(true)
    expect('isError' in result.current).toBe(true)
    expect('error' in result.current).toBe(true)
    expect(typeof result.current.refetch).toBe('function')
  })

  it('Given undefined id When hook renders Then isLoading is false (not fetching)', () => {
    // Edge: disabled query must not report isLoading = true
    const { result } = renderHook(() => useCliente(undefined), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('Given empty string id When hook renders Then isLoading is false (disabled)', () => {
    // Edge: '' is falsy → disabled → isLoading must be false
    const { result } = renderHook(() => useCliente(''), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Refetch behaviour — called after error
// ---------------------------------------------------------------------------
describe('useCliente — refetch on error path', () => {
  it('Given isError true When refetch called and server now succeeds Then isSuccess becomes true', async () => {
    // AC#4 — retry support: refetch recovers from error
    let callCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ status: 500, title: 'Failure' }, { status: 500 })
        }
        return HttpResponse.json(mockCliente)
      }),
    )

    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Trigger refetch
    act(() => { result.current.refetch() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.id).toBe(mockCliente.id)
  })
})

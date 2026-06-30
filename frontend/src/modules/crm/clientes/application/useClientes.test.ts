/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component/Unit Level)
 * useClientes hook — TanStack Query integration
 *
 * Acceptance Criteria covered:
 *   AC1 — useClientes returns data from GET /api/v1/clientes
 *   AC4 — useClientes exposes isError + refetch for ErrorPanel retry handler
 *   AC6 — queryKey ['clientes'] is used; staleTime: 30_000 set
 *
 * These tests FAIL until useClientes.ts is implemented.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useClientes } from './useClientes'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Empresa Mock Alpha',
    nit: '900111000-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Empresa Mock Beta',
    nit: '900222000-2',
    telefono: '3009876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes)
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,        // No retries in tests
        staleTime: 0,        // Override for test isolation (force fresh fetches)
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — hook fetches and returns data
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — data fetching', () => {
  it('should return isLoading=true initially before data arrives', () => {
    // GIVEN: MSW will respond (but not yet)
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // WHEN: Hook is first rendered
    // THEN: isLoading is true before the response arrives
    expect(result.current.isLoading).toBe(true)
  })

  it('should return the list of clientes after successful fetch (AC1)', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes and returns mockClientes
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // WHEN: The query resolves
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: data contains the two mock clientes
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].nombre).toBe('Empresa Mock Alpha')
    expect(result.current.data?.[1].nombre).toBe('Empresa Mock Beta')
  })

  it('should return isLoading=false and data populated after fetch completes', async () => {
    // GIVEN: MSW returns mocked data
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: Both flags are in the expected post-load state
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — hook exposes isError and refetch
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — error state (AC4)', () => {
  it('should return isError=true when GET /api/v1/clientes fails with 500', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 })
      }),
    )

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // WHEN: The query fails
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
  })

  it('should expose a refetch function for the ErrorPanel retry button (AC4)', async () => {
    // GIVEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: refetch is a function that can be called by ErrorPanel
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should recover data after refetch when backend becomes available again (AC4)', async () => {
    // GIVEN: Backend initially returns 500
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json({ title: 'Error', status: 500 }, { status: 500 })
      }),
    )

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // WHEN: Backend recovers and user calls refetch
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json(mockClientes)
      }),
    )
    await result.current.refetch()

    // THEN: Data is now available and isError is false
    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(result.current.data).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — queryKey ['clientes'] and staleTime configuration
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — TanStack Query cache (AC6)', () => {
  it('should use queryKey ["clientes"] (canonical key from architecture)', async () => {
    // GIVEN: QueryClient with spy on queries
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useClientes(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: The cache entry exists under key ['clientes']
    const cachedData = queryClient.getQueryData(['clientes'])
    expect(cachedData).toBeDefined()
    expect(Array.isArray(cachedData)).toBe(true)
  })

  it('should serve data from cache without a new network request within staleTime', async () => {
    // GIVEN: QueryClient with staleTime matching production config (30_000)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    })
    let fetchCount = 0

    server.use(
      http.get('*/api/v1/clientes', () => {
        fetchCount++
        return HttpResponse.json(mockClientes)
      }),
    )

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // First render — triggers fetch
    const { rerender } = renderHook(() => useClientes(), { wrapper })
    await waitFor(() => expect(queryClient.getQueryData(['clientes'])).toBeDefined())

    // WHEN: Hook re-renders within staleTime (simulating re-mount)
    rerender()
    await waitFor(() => expect(fetchCount).toBe(1))

    // THEN: Only ONE network request was made (cache served the second render)
    expect(fetchCount).toBe(1)
  })
})

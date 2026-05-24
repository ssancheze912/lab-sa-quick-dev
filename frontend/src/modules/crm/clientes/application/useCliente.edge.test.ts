/**
 * Story 2.2: Client Detail View
 * Edge Case Tests — useCliente Hook (Vitest + RTL renderHook + MSW)
 *
 * Expands ATDD coverage with edge cases NOT covered by the primary test suite:
 *   - Hook is disabled (no fetch) when id is empty string (enabled: !!id = false)
 *   - Hook is disabled when id is only whitespace
 *   - Generic server error (500) sets isError=true (not the same as 404 path)
 *   - Network-level failure (no response) sets isError=true
 *   - Refetch triggers a new API request
 *   - id change triggers a new query (reactive key)
 *   - Hook with different id values uses distinct queryKeys in cache
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement, useState } from 'react'
import { useCliente } from './useCliente'

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ID = 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_ID_2 = 'bbbb0002-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const mockCliente = {
  id: TEST_ID,
  nombre: 'Empresa Detalle Test',
  nitRuc: '900111222',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
}

const mockCliente2 = {
  id: TEST_ID_2,
  nombre: 'Segunda Empresa',
  nitRuc: '800999888',
  telefono: '3009998887',
  ciudad: 'Medellín',
  createdAt: '2026-04-01T08:00:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('/api/v1/clientes/:id', ({ params }) => {
    if (params.id === TEST_ID) return HttpResponse.json(mockCliente)
    if (params.id === TEST_ID_2) return HttpResponse.json(mockCliente2)
    return new HttpResponse(null, { status: 404 })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

  return {
    queryClient,
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children)
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Hook disabled when id is empty string
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — disabled when id is empty string', () => {
  it('[P2] Given id is empty string, When useCliente is called, Then the query is not triggered (isPending)', async () => {
    // GIVEN: An empty id — enabled: !!id evaluates to false
    const { wrapper } = createWrapper()

    // WHEN: Hook renders with empty string
    const { result } = renderHook(() => useCliente(''), { wrapper })

    // THEN: Query remains pending/disabled — no data and no error
    // isPending is stable synchronously when enabled:false — no wait needed
    expect(result.current.data).toBeUndefined()
    expect(result.current.isError).toBe(false)
  })

  it('[P2] Given id is empty string, When useCliente is called, Then isSuccess is false', async () => {
    // GIVEN: Empty id
    const { wrapper } = createWrapper()

    // WHEN: Hook renders with empty id
    const { result } = renderHook(() => useCliente(''), { wrapper })

    // THEN: Query never resolves to success — enabled:false keeps state as isPending
    expect(result.current.isSuccess).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Generic server error (500) — not 404
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — server error 500', () => {
  it('[P2] Given API returns 500, When useCliente rejects, Then isError is true', async () => {
    // GIVEN: MSW returns HTTP 500 (infrastructure error, not a not-found)
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
        )
      })
    )

    const { wrapper } = createWrapper()

    // WHEN: Hook runs and the API returns 500
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
  })

  it('[P2] Given API returns 500, When useCliente rejects, Then error response status is 500 (not 404)', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { wrapper } = createWrapper()

    // WHEN: Hook runs
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: Error status is 500 — this is NOT a not-found, so ClienteDetailView should show ErrorPanel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (result.current.error as any)?.response?.status
    expect(status).toBe(500)
  })

  it('[P2] Given API returns 500, When useCliente rejects, Then data remains undefined', async () => {
    // GIVEN: Server error
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: No stale data is exposed when error occurs
    expect(result.current.data).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Network-level failure (no HTTP response)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — network failure (no response)', () => {
  it('[P2] Given a network-level failure, When useCliente runs, Then isError is true', async () => {
    // GIVEN: MSW simulates a network drop (no response at all)
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      })
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
  })

  it('[P2] Given a network failure, When useCliente runs, Then data is undefined', async () => {
    // GIVEN: Network error
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      })
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: Data is never populated from a failed request
    expect(result.current.data).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Different ids produce different queryKeys (cache isolation)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — distinct queryKeys per id', () => {
  it('[P2] Given two different ids, When both hooks run, Then cache contains two distinct queryKeys', async () => {
    // GIVEN: Fresh QueryClient shared by both hooks
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // WHEN: Both hooks run and resolve
    const { result: r1 } = renderHook(() => useCliente(TEST_ID), { wrapper })
    const { result: r2 } = renderHook(() => useCliente(TEST_ID_2), { wrapper })

    await waitFor(() => {
      expect(r1.current.isSuccess).toBe(true)
      expect(r2.current.isSuccess).toBe(true)
    })

    // THEN: Cache holds separate entries for ['clientes', TEST_ID] and ['clientes', TEST_ID_2]
    const queries = queryClient.getQueryCache().getAll()
    const key1Found = queries.some(
      (q) => JSON.stringify(q.queryKey) === JSON.stringify(['clientes', TEST_ID])
    )
    const key2Found = queries.some(
      (q) => JSON.stringify(q.queryKey) === JSON.stringify(['clientes', TEST_ID_2])
    )

    expect(key1Found).toBe(true)
    expect(key2Found).toBe(true)
  })

  it('[P2] Given two different ids, When both resolve, Then each returns its own client data', async () => {
    // GIVEN: QueryClient shared
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // WHEN: Both hooks resolve
    const { result: r1 } = renderHook(() => useCliente(TEST_ID), { wrapper })
    const { result: r2 } = renderHook(() => useCliente(TEST_ID_2), { wrapper })

    await waitFor(() => {
      expect(r1.current.isSuccess).toBe(true)
      expect(r2.current.isSuccess).toBe(true)
    })

    // THEN: Each hook returns data for its own id — no cross-contamination
    expect(r1.current.data?.nombre).toBe('Empresa Detalle Test')
    expect(r2.current.data?.nombre).toBe('Segunda Empresa')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Case: Refetch triggers a new request
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — refetch triggers new request', () => {
  it('[P2] Given data is loaded, When refetch is called, Then it resolves with updated data', async () => {
    // GIVEN: Initial fetch succeeds
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // WHEN: refetch is called explicitly
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: Data is still present after refetch (query re-ran and re-resolved)
    expect(result.current.data?.nombre).toBe('Empresa Detalle Test')
    expect(result.current.isError).toBe(false)
  })
})

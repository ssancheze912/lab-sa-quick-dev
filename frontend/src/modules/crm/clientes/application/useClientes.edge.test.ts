/**
 * Unit Edge-Case Tests — useClientes hook
 * Story 2.1: Client List & Search
 * Expands ATDD unit coverage with error paths and boundary conditions
 * NOT covered by useClientes.test.ts (ATDD happy paths)
 *
 * Scenarios:
 *   EC-UNIT-01 — isError=true when API returns 500
 *   EC-UNIT-02 — data=undefined while isLoading=true (initial state)
 *   EC-UNIT-03 — refetch triggers a new network call after success
 *   EC-UNIT-04 — refetch triggers a new network call after error
 *   EC-UNIT-05 — hook returns isSuccess=false while loading
 *   EC-UNIT-06 — hook uses queryKey=['clientes'] (TanStack Query invalidation alignment)
 *   EC-UNIT-07 — hook returns empty array when API returns []
 *   EC-UNIT-08 — network timeout results in isError=true (not a hanging state)
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { useClientes } from './useClientes'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const mockClientes: Cliente[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corp',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
  return { wrapper: Wrapper, queryClient: qc }
}

// ---------------------------------------------------------------------------
// EC-UNIT-01: isError=true when API returns 500
// ---------------------------------------------------------------------------

describe('Edge: isError state', () => {
  test('[P1] isError is true when the API returns 500', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: isError is true and data is undefined
    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  test('[P1] isError is true when the API returns 404', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isError).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-02: data=undefined while isLoading=true
// ---------------------------------------------------------------------------

describe('Edge: data is undefined during loading', () => {
  test('[P1] data is undefined while the hook is in loading state', () => {
    // GIVEN: No handler override — default takes time due to Promise resolution
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    // THEN: While loading, data is undefined (not an empty array, not null)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-03: refetch triggers a new call after success
// ---------------------------------------------------------------------------

describe('Edge: refetch after success', () => {
  test('[P1] calling refetch() after successful load triggers another GET request', async () => {
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json(mockClientes)
      }),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const countAfterFirstLoad = callCount

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: Another network request was made
    expect(callCount).toBeGreaterThan(countAfterFirstLoad)
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-04: refetch triggers a new call after error
// ---------------------------------------------------------------------------

describe('Edge: refetch after error', () => {
  test('[P1] calling refetch() after an error triggers another GET request', async () => {
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json({ error: 'fail' }, { status: 500 })
      }),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const countAfterError = callCount

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: Another network request was made (refetch works from error state)
    expect(callCount).toBeGreaterThan(countAfterError)
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-05: isSuccess=false while loading
// ---------------------------------------------------------------------------

describe('Edge: isSuccess is false while loading', () => {
  test('[P2] isSuccess is false in the initial loading state', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    // THEN: Before the query resolves, isSuccess must be false
    expect(result.current.isSuccess).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-06: queryKey includes 'clientes' (invalidation alignment)
// ---------------------------------------------------------------------------

describe('Edge: queryKey alignment', () => {
  test('[P2] the hook stores data under the ["clientes"] queryKey in the QueryClient', async () => {
    const { wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: The queryClient has cached data under ['clientes']
    const cachedData = queryClient.getQueryData<Cliente[]>(['clientes'])
    expect(cachedData).toBeDefined()
    expect(Array.isArray(cachedData)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-07: Empty array returned when API returns []
// ---------------------------------------------------------------------------

describe('Edge: empty array from API', () => {
  test('[P1] data is an empty array (not undefined) when API returns []', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: data is defined and is an empty array
    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveLength(0)
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// EC-UNIT-08: Network error (connection refused) results in isError=true
// ---------------------------------------------------------------------------

describe('Edge: Network failure', () => {
  test('[P1] isError is true when the network request fails entirely (connection error)', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error()
      }),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })

    // THEN: Hook surfaces the error state
    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})

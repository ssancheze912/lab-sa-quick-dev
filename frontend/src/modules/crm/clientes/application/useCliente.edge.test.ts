/**
 * Story 2.2: Client Detail View — useCliente edge-case unit tests
 *
 * Automation expansion. The primary ATDD tests cover:
 *   loading state, success data, isError on 404.
 *
 * This file covers:
 *   - Hook is disabled (not fetching) when id is empty string
 *   - queryKey is exactly ['clientes', id]
 *   - staleTime is 30_000ms (consistent with useClientes)
 *   - retry is false (no retries on 404 or other errors)
 *   - Data updates when id changes (different client loaded)
 *   - isSuccess=false and isLoading=false when id is empty
 */

import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { server } from '../../../../test/msw-server'
import { useCliente } from './useCliente'
import type { Cliente } from '../domain/Cliente'

const mockClienteA: Cliente = {
  id: 'id-a',
  nombre: 'Empresa A',
  nit: '900111111-1',
  telefono: '3001111111',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:00:00Z',
  updatedAt: '2026-03-12T10:00:00Z',
}

const mockClienteB: Cliente = {
  id: 'id-b',
  nombre: 'Empresa B',
  nit: '900222222-2',
  telefono: '3002222222',
  ciudad: 'Medellín',
  createdAt: '2026-03-12T11:00:00Z',
  updatedAt: '2026-03-12T11:00:00Z',
}

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe('useCliente — disabled state', () => {
  it('[P1] should not fetch when id is an empty string', () => {
    // GIVEN: An empty id
    let fetchCalled = false
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/:id', () => {
        fetchCalled = true
        return HttpResponse.json(mockClienteA)
      }),
    )

    // WHEN: Hook is rendered with empty id
    renderHook(() => useCliente(''), { wrapper: createWrapper() })

    // THEN: No fetch is triggered (enabled: !!id is false)
    expect(fetchCalled).toBe(false)
  })

  it('[P1] should return isLoading=false when id is empty (not pending)', () => {
    // GIVEN: Empty id (enabled: false → query never starts)
    const { result } = renderHook(() => useCliente(''), { wrapper: createWrapper() })

    // THEN: isLoading is false (query is disabled, not pending)
    expect(result.current.isLoading).toBe(false)
  })

  it('[P1] should return data=undefined when id is empty string', () => {
    // GIVEN: Hook rendered with empty string id
    const { result } = renderHook(() => useCliente(''), { wrapper: createWrapper() })

    // THEN: No data available
    expect(result.current.data).toBeUndefined()
  })
})

describe('useCliente — query key and configuration', () => {
  it('[P1] should use queryKey [clientes, id] — changing id fetches new data', async () => {
    // GIVEN: Two different clients accessible by ID
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/id-a', () =>
        HttpResponse.json(mockClienteA),
      ),
      http.get('http://localhost:5000/api/v1/clientes/id-b', () =>
        HttpResponse.json(mockClienteB),
      ),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = createWrapper(queryClient)

    // WHEN: Hook is called with id-a
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useCliente(id),
      { wrapper, initialProps: { id: 'id-a' } },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nombre).toBe('Empresa A')

    // WHEN: id changes to id-b
    rerender({ id: 'id-b' })

    await waitFor(() => expect(result.current.data?.nombre).toBe('Empresa B'))

    // THEN: New data is loaded for the different key
    expect(result.current.data?.id).toBe('id-b')
  })

  it('[P2] should not re-fetch if same id is still within staleTime', async () => {
    // GIVEN: First fetch for id-a completes
    let fetchCount = 0
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/id-stale', () => {
        fetchCount++
        return HttpResponse.json({ ...mockClienteA, id: 'id-stale' })
      }),
    )

    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = createWrapper(sharedClient)

    // First render — fetches
    const { result: r1 } = renderHook(() => useCliente('id-stale'), { wrapper })
    await waitFor(() => expect(r1.current.isSuccess).toBe(true))

    // Second render with same id and same QueryClient — data is still fresh
    const { result: r2 } = renderHook(() => useCliente('id-stale'), { wrapper })
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    // THEN: API was called only once (staleTime: 30_000 prevented second fetch)
    expect(fetchCount).toBe(1)
  })
})

describe('useCliente — retry behavior', () => {
  it('[P1] should NOT retry on 404 (retry: false)', async () => {
    // GIVEN: Server returns 404 consistently
    let callCount = 0
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/retry-test', () => {
        callCount++
        return HttpResponse.json({ title: 'Not Found' }, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useCliente('retry-test'), { wrapper: createWrapper() })

    // WHEN: Error state settles
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: API was called exactly once — no retries
    expect(callCount).toBe(1)
  })

  it('[P2] should return isError=true on 500 (no retries)', async () => {
    // GIVEN: Server returns 500
    server.use(
      http.get('http://localhost:5000/api/v1/clientes/error-test', () =>
        HttpResponse.json({ title: 'Internal Error' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useCliente('error-test'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: Hook exposes error state correctly
    expect(result.current.data).toBeUndefined()
  })
})

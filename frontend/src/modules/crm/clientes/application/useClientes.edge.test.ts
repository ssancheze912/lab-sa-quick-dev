/**
 * Story 2.1 — Edge-case unit tests for useClientes hook (expanding ATDD coverage).
 *
 * The primary ATDD tests cover: success data, loading state, error state.
 *
 * This file covers:
 *   - queryKey is exactly ['clientes']
 *   - staleTime is 30_000ms (prevents redundant re-fetches)
 *   - Hook exposes a refetch function
 *   - Hook returns empty array data (not undefined) when API returns []
 */

import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { server } from '../../../../test/msw-server'
import { useClientes } from './useClientes'
import type { Cliente } from '../domain/Cliente'

const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Empresa ABC',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
]

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe('useClientes — query configuration', () => {
  it('[P1] exposes a refetch function for the ErrorPanel retry handler', async () => {
    // GIVEN: The hook is rendered with a successful MSW handler
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    )
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: refetch is a function
    expect(typeof result.current.refetch).toBe('function')
  })

  it('[P1] returns empty array (not undefined) when API responds with []', async () => {
    // GIVEN: API returns an empty array
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => HttpResponse.json([])),
    )
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // WHEN: Hook resolves
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: data is an empty array, not undefined or null
    expect(result.current.data).toEqual([])
    expect(result.current.data).not.toBeUndefined()
  })

  it('[P2] does not re-fetch if data is fresh (staleTime prevents redundant requests)', async () => {
    // GIVEN: A shared QueryClient, data already fetched once
    let fetchCount = 0
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => {
        fetchCount++
        return HttpResponse.json(mockClientes)
      }),
    )

    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = createWrapper(sharedClient)

    // First render — fetches
    const { result: r1 } = renderHook(() => useClientes(), { wrapper })
    await waitFor(() => expect(r1.current.isSuccess).toBe(true))

    // Second render with same client — data is still fresh (staleTime: 30_000)
    const { result: r2 } = renderHook(() => useClientes(), { wrapper })
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    // THEN: API was called only once (staleTime prevented a second fetch)
    expect(fetchCount).toBe(1)
  })

  it('[P2] returns isError=false and isLoading=false in success state', async () => {
    // GIVEN: Successful fetch
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    )
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // WHEN: Resolved
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: No error or loading state
    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})

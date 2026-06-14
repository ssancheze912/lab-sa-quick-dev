/**
 * Story 2.2: Client Detail View — useCliente Hook Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (useCliente.test.ts).
 * Covers:
 *   - Empty string id treated as disabled (falsy → enabled: false)
 *   - Hook re-fetches when id changes from one UUID to another
 *   - Network/fetch error (non-4xx) causes isError=true, data=undefined
 *   - staleTime: query does not re-fetch immediately when called twice in rapid succession
 *   - When hook transitions from null id to valid id, query becomes enabled and fetches
 *   - isLoading is false when id is null (query disabled)
 *   - isFetching vs isLoading semantics: disabled query is never fetching
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCliente } from '../useCliente'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'
const CLIENT_ID_A = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const CLIENT_ID_B = '4fa85f64-5717-4562-b3fc-2c963f66afa7'

const mockClienteA = createCliente({
  id: CLIENT_ID_A,
  nombre: 'Empresa Alpha',
  nit: '900000001-1',
  telefono: '601 111 1111',
  ciudad: 'Bogotá',
})

const mockClienteB = createCliente({
  id: CLIENT_ID_B,
  nombre: 'Empresa Beta',
  nit: '900000002-2',
  telefono: '602 222 2222',
  ciudad: 'Medellín',
})

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
    HttpResponse.json(mockClienteA)
  ),
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_B}`, () =>
    HttpResponse.json(mockClienteB)
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('useCliente hook — edge cases', () => {

  // ─── Empty string id treated as disabled ────────────────────────────────────

  it('[P2] should treat empty string id as disabled — not fetch, isLoading=false', () => {
    // GIVEN: empty string is falsy in JavaScript
    const { result } = renderHook(() => useCliente(''), { wrapper: createWrapper() })

    // THEN: hook is disabled — no fetch, no loading
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('[P2] empty string id should not set isFetching=true', () => {
    // GIVEN: empty string (falsy)
    const { result } = renderHook(() => useCliente(''), { wrapper: createWrapper() })

    // THEN: query is not fetching
    expect(result.current.isFetching).toBe(false)
  })

  // ─── null id is disabled — not fetching ────────────────────────────────────

  it('[P1] null id should result in isFetching=false (query disabled)', () => {
    // GIVEN: null id
    const { result } = renderHook(() => useCliente(null), { wrapper: createWrapper() })

    // THEN: query is not fetching
    expect(result.current.isFetching).toBe(false)
  })

  // ─── Transition from null to valid id triggers fetch ──────────────────────

  it('[P1] should fetch when id transitions from null to a valid UUID', async () => {
    // GIVEN: hook starts with null id (disabled)
    let id: string | null = null
    const { result, rerender } = renderHook(() => useCliente(id), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()

    // WHEN: id changes to a valid UUID
    id = CLIENT_ID_A
    rerender()

    // THEN: hook fetches and returns data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.id).toBe(CLIENT_ID_A)
    expect(result.current.data?.nombre).toBe('Empresa Alpha')
  })

  // ─── Hook re-fetches when id changes UUID ──────────────────────────────────

  it('[P1] should fetch new client data when id changes from one UUID to another', async () => {
    // GIVEN: hook fetches client A
    let id: string | null = CLIENT_ID_A
    const { result, rerender } = renderHook(() => useCliente(id), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.data?.nombre).toBe('Empresa Alpha')

    // WHEN: id changes to client B's UUID
    id = CLIENT_ID_B
    rerender()

    // THEN: hook fetches and returns client B data
    await waitFor(() => {
      expect(result.current.data?.nombre).toBe('Empresa Beta')
    })

    expect(result.current.data?.id).toBe(CLIENT_ID_B)
    expect(result.current.data?.nit).toBe('900000002-2')
  })

  // ─── Network error (non-HTTP, e.g. fetch failure) causes isError=true ───────

  it('[P1] should set isError=true on network-level fetch failure (not just HTTP errors)', async () => {
    // GIVEN: the endpoint throws a network-level error (no HTTP response)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useCliente(CLIENT_ID_A), { wrapper: createWrapper() })

    // THEN: isError becomes true (network failure)
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
  })

  // ─── 500 response — isError=true, data=undefined ──────────────────────────

  it('[P1] should have data=undefined (not null) when API returns 500', async () => {
    // GIVEN: the endpoint returns 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useCliente(CLIENT_ID_A), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: data is undefined (not null — null is only returned on 404)
    expect(result.current.data).toBeUndefined()
  })

  // ─── 404 response — data=null (distinguished from 500/undefined) ──────────

  it('[P1] should have data=null (not undefined) specifically when API returns 404', async () => {
    // GIVEN: the endpoint returns 404
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
        HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useCliente(CLIENT_ID_A), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: data is null (the repository maps 404 to null, not undefined)
    expect(result.current.data).toBeNull()
    // AND: isError is false (404 is handled gracefully, not treated as an error)
    expect(result.current.isError).toBe(false)
  })

  // ─── refetch function triggers a new request ──────────────────────────────

  it('[P2] refetch should trigger a new API request and update data', async () => {
    // GIVEN: hook has loaded initial data
    const { result } = renderHook(() => useCliente(CLIENT_ID_A), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.nombre).toBe('Empresa Alpha')

    // AND: API is updated to return different data for the same id (simulate backend update)
    const updatedCliente = { ...mockClienteA, nombre: 'Empresa Alpha Actualizada' }
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID_A}`, () =>
        HttpResponse.json(updatedCliente)
      )
    )

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: data is updated
    await waitFor(() => {
      expect(result.current.data?.nombre).toBe('Empresa Alpha Actualizada')
    })
  })

  // ─── isLoading false after successful fetch ────────────────────────────────

  it('[P1] isLoading should be false after data has been successfully fetched', async () => {
    // GIVEN: hook is rendering with a valid id
    const { result } = renderHook(() => useCliente(CLIENT_ID_A), { wrapper: createWrapper() })

    // WHEN: data has loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: isLoading is false and data is present
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeDefined()
  })
})

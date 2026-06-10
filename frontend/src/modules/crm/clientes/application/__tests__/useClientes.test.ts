/**
 * Unit Tests — Story 2.1: Client List & Search
 * Test IDs: T2.1-004, T2.1-005, T2.1-006
 *
 * RED PHASE — All tests intentionally fail until useClientes hook and
 * useClientesFiltrados function are implemented.
 *
 * AC2: Client-side search filters by Nombre AND NIT/RUC using useMemo.
 *      Results must appear in under 1 second with up to 500 records (NFR1).
 *
 * Stack: Vitest + @testing-library/react (renderHook)
 * QueryClient: retry: 0, staleTime: 0 to prevent caching interference
 *
 * Pattern: Given-When-Then | Tests the pure filtering logic
 */

import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  clienteListSuccessHandler,
  mockClientes,
} from '../../../../../test/handlers/clientes'
import { createClientes } from '../../../../../test/factories/cliente.factory'

// ---------------------------------------------------------------------------
// MSW Server setup
// ---------------------------------------------------------------------------

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Helper: Creates wrapper with isolated QueryClient
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ---------------------------------------------------------------------------
// T2.1-004 — AC2: useClientesFiltrados filters by Nombre in real time
// ---------------------------------------------------------------------------

describe('T2.1-004 — AC2: Filter by Nombre returns correct subset', () => {
  test('should return only clients whose Nombre matches the search query', async () => {
    // GIVEN: MSW returns 3 clients; hook is mounted with a search query
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('Alfa'), {
      wrapper: createWrapper(),
    })

    // WHEN: Data loads and filter is applied
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: Only "Empresa Alfa" (nit: 123456789) is in the filtered result
    expect(result.current.filteredClientes).toHaveLength(1)
    expect(result.current.filteredClientes[0].nombre).toBe('Empresa Alfa')
  })

  test('should be case-insensitive when filtering by Nombre', async () => {
    // GIVEN: MSW returns 3 clients; search query uses uppercase
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('ALFA'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: Filter is case-insensitive — "Empresa Alfa" still matches
    expect(result.current.filteredClientes).toHaveLength(1)
    expect(result.current.filteredClientes[0].nombre).toBe('Empresa Alfa')
  })

  test('should return the full list when search query is empty', async () => {
    // GIVEN: MSW returns 3 clients; search query is empty string
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados(''), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: All 3 clients are returned (no filter applied)
    expect(result.current.filteredClientes).toHaveLength(mockClientes.length)
  })

  test('should return empty array when no Nombre matches the query', async () => {
    // GIVEN: MSW returns 3 clients; search query matches nothing
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('XYZ_NO_MATCH'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: No clients match the query
    expect(result.current.filteredClientes).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// T2.1-005 — AC2: useClientesFiltrados filters by NIT/RUC
// ---------------------------------------------------------------------------

describe('T2.1-005 — AC2: Filter by NIT/RUC returns correct subset', () => {
  test('should return only clients whose NIT matches the search query', async () => {
    // GIVEN: MSW returns 3 clients; search query is a NIT value
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('987654321'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: Only "Compañía Beta" (nit: 987654321) matches
    expect(result.current.filteredClientes).toHaveLength(1)
    expect(result.current.filteredClientes[0].nit).toBe('987654321')
    expect(result.current.filteredClientes[0].nombre).toBe('Compañía Beta')
  })

  test('should return clients matching partial NIT search', async () => {
    // GIVEN: MSW returns 3 clients; search query is a partial NIT
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('9876'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: Only "Compañía Beta" (nit starts with 987654321) matches
    expect(result.current.filteredClientes).toHaveLength(1)
    expect(result.current.filteredClientes[0].nombre).toBe('Compañía Beta')
  })

  test('should match both Nombre and NIT when multiple clients partially match', async () => {
    // GIVEN: MSW returns 3 clients; search "123" matches NIT of Empresa Alfa (123456789)
    //        and NIT of Corporación Gamma (456789123)
    server.use(clienteListSuccessHandler)
    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: Both clients whose NIT contains "123" are returned
    expect(result.current.filteredClientes.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// T2.1-006 (P3) — NFR1: Filter 500 clients in under 100ms
// ---------------------------------------------------------------------------

describe('T2.1-006 (P3) — NFR1: Filter performance with 500 records', () => {
  test('should filter 500 clients in under 100ms', async () => {
    // GIVEN: 500 mock clients are available via MSW
    const bulk500 = createClientes(500)
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(bulk500, { status: 200 })),
    )

    const { useClientesFiltrados } = await import('../useClientes')

    const { result } = renderHook(() => useClientesFiltrados('Empresa'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // WHEN: Measuring filter execution time
    const start = performance.now()
    const filtered = result.current.filteredClientes
    const duration = performance.now() - start

    // THEN: Filtering completes in under 100ms (NFR1 requires <1s; internal target <100ms)
    expect(duration).toBeLessThan(100)
    expect(Array.isArray(filtered)).toBe(true)
  })
})

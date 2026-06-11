/**
 * Story 2.1: Client List & Search — useClientes Hook Tests (RED Phase)
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level)
 * These tests are intentionally FAILING until useClientes hook is implemented.
 *
 * Verifies:
 *   - TanStack Query key is exactly ['clientes'] (not string 'clientes')
 *   - Hook exposes { data, isLoading, isError, refetch }
 *   - Hook calls clienteApiRepository.getAll()
 */

import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// ─── MSW Server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Test Wrapper ─────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, Wrapper }
}

// ─── Import Hook (RED: will fail until implementation exists) ─────────────────

// NOTE: useClientes does not exist yet.
// File will be created at:
//   frontend/src/modules/crm/clientes/application/useClientes.ts
import { useClientes } from './useClientes'

// ─────────────────────────────────────────────────────────────────────────────
// Hook contract tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — hook contract', () => {
  it('should use TanStack Query key exactly [\'clientes\'] (array, not string)', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    const { Wrapper, queryClient } = createWrapper()

    // WHEN: useClientes is called
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: The query cache holds the key ['clientes'] as an array
    const queries = queryClient.getQueryCache().getAll()
    const clientesQuery = queries.find(q =>
      Array.isArray(q.queryKey) &&
      q.queryKey.length === 1 &&
      q.queryKey[0] === 'clientes'
    )
    expect(clientesQuery).toBeDefined()
  })

  it('should expose data, isLoading, isError, and refetch', async () => {
    // GIVEN: MSW returns a list
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json([])
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: useClientes is called
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: The hook exposes required properties
    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('refetch')
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should return the client list from GET /api/v1/clientes', async () => {
    // GIVEN: MSW returns two clients
    const clients = [
      { id: '111', nombre: 'Alpha Corp', nit: 'NIT-001', telefono: '300', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: '222', nombre: 'Beta Inc', nit: 'NIT-002', telefono: '301', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json(clients)
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: useClientes loads data
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: data contains the returned clients
    expect(result.current.data).toHaveLength(2)
    expect(result.current.isError).toBe(false)
  })

  it('should set isError=true when API returns 500', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { Wrapper } = createWrapper()

    // WHEN: useClientes encounters an error
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})

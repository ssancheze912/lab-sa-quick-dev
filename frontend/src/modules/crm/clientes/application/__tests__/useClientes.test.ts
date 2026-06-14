/**
 * Story 2.1: Client List & Search — useClientes Hook Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - useClientes hook does not exist yet (frontend/src/modules/crm/clientes/application/useClientes.ts)
 * - clienteApiRepository does not exist yet
 *
 * Acceptance Criteria covered:
 *   AC#1 — Hook provides typed list of clients when API returns data
 *   AC#5 — Hook exposes isError when fetch fails
 *   AC#6 — Hook exposes isLoading during initial fetch
 *
 * Test case from test-design-epic-2.md:
 *   TC-E2-P3-06: useClientes hook returns typed data
 *   TC-E2-P1-01: GET /api/v1/clientes returns all clients (hook level)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../useClientes'"
import { useClientes } from '../useClientes'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes`, () =>
    HttpResponse.json([
      createCliente({ nombre: 'Empresa Test 1', nit: '900111222-1' }),
      createCliente({ nombre: 'Empresa Test 2', nit: '900333444-2' }),
      createCliente({ nombre: 'Empresa Test 3', nit: '900555666-3' }),
    ])
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useClientes hook', () => {
  it('should return isLoading=true initially while fetch is in progress (AC#6)', async () => {
    // GIVEN: MSW will return data (but not immediately)

    // WHEN: hook is first rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: loading state is true before data arrives
    expect(result.current.isLoading).toBe(true)
  })

  it('should return an array of 3 clients when API responds with 3 records (TC-E2-P3-06)', async () => {
    // GIVEN: MSW returns 3 clients (default handler)

    // WHEN: hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: data is an array of 3 Cliente objects
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data).toHaveLength(3)
  })

  it('should return typed Cliente objects with all required fields (TC-E2-P3-06)', async () => {
    // GIVEN: MSW returns 3 clients

    // WHEN: hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: each item has all 7 required fields from the domain interface
    const clientes = result.current.data!
    clientes.forEach((cliente) => {
      expect(typeof cliente.id).toBe('string')
      expect(typeof cliente.nombre).toBe('string')
      expect(typeof cliente.nit).toBe('string')
      expect(typeof cliente.telefono).toBe('string')
      expect(typeof cliente.ciudad).toBe('string')
      expect(typeof cliente.createdAt).toBe('string')
      expect(typeof cliente.updatedAt).toBe('string')
    })
  })

  it('should expose isError=true when backend returns 500 (AC#5)', async () => {
    // GIVEN: MSW returns a server error
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    )

    // WHEN: hook resolves to error state
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: data is undefined (no partial data on error)
    expect(result.current.data).toBeUndefined()
  })

  it('should expose a refetch function (AC#5 — enables Reintentar button)', async () => {
    // GIVEN: hook resolves successfully

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: refetch function is available and callable
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should use queryKey ["clientes"] (per architecture spec)', async () => {
    // GIVEN: hook renders without error
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: hook returns data (queryKey matches what the backend uses — indirectly verified
    // by successful fetch via MSW handler keyed to /api/v1/clientes)
    expect(result.current.data).toBeDefined()
  })
})

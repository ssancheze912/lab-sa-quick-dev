/**
 * Story 2.2: Client Detail View — useCliente Hook Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - useCliente hook does not exist yet (frontend/src/modules/crm/clientes/application/useCliente.ts)
 * - clienteApiRepository.getById method does not exist yet
 *
 * Acceptance Criteria covered:
 *   AC#3 — Direct URL /clientes/:clienteId loads correct client via GET /api/v1/clientes/{id}
 *   AC#4 — Non-existent clienteId: useCliente returns data=null gracefully (no crash)
 *   AC#5 — While loading, isLoading=true (skeleton can be rendered by parent)
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-05: GET /api/v1/clientes/{id} returns 404 → data null (hook level)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../useCliente'"
import { useCliente } from '../useCliente'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'
const CLIENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000'

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
    HttpResponse.json(
      createCliente({
        id: CLIENT_ID,
        nombre: 'Empresa ABC',
        nit: '900123456-7',
        telefono: '601 234 5678',
        ciudad: 'Bogotá',
      })
    )
  ),
  http.get(`${API_BASE}/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
    HttpResponse.json(
      { title: 'Cliente no encontrado.', status: 404 },
      { status: 404 }
    )
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

describe('useCliente hook', () => {
  // ─── AC#5: Loading state ───────────────────────────────────────────────────

  it('should return isLoading=true initially while fetch is in progress (AC#5)', async () => {
    // GIVEN: MSW will return data for CLIENT_ID (but not immediately)

    // WHEN: hook is first rendered with a valid id
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    // THEN: loading state is true before data arrives
    expect(result.current.isLoading).toBe(true)
  })

  // ─── AC#3: Returns correct client data for existing ID ────────────────────

  it('should return the correct cliente when API responds with 200 (AC#3)', async () => {
    // GIVEN: MSW returns a client for CLIENT_ID

    // WHEN: hook resolves
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: data contains the correct client object
    expect(result.current.data).toBeDefined()
    expect(result.current.data).not.toBeNull()
    expect(result.current.data?.id).toBe(CLIENT_ID)
    expect(result.current.data?.nombre).toBe('Empresa ABC')
    expect(result.current.data?.nit).toBe('900123456-7')
    expect(result.current.data?.telefono).toBe('601 234 5678')
    expect(result.current.data?.ciudad).toBe('Bogotá')
  })

  it('should return typed Cliente with all 7 required fields (AC#3)', async () => {
    // GIVEN: MSW returns a full client DTO

    // WHEN: hook resolves
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: all required domain fields are present and typed correctly
    const cliente = result.current.data!
    expect(typeof cliente.id).toBe('string')
    expect(typeof cliente.nombre).toBe('string')
    expect(typeof cliente.nit).toBe('string')
    expect(typeof cliente.telefono).toBe('string')
    expect(typeof cliente.ciudad).toBe('string')
    expect(typeof cliente.createdAt).toBe('string')
    expect(typeof cliente.updatedAt).toBe('string')
  })

  // ─── AC#4: Non-existent client returns null gracefully ────────────────────

  it('should return data=null when API returns 404 (AC#4 — TC-E2-P1-05)', async () => {
    // GIVEN: MSW returns 404 for NON_EXISTENT_ID

    // WHEN: hook resolves for a non-existent id
    const { result } = renderHook(() => useCliente(NON_EXISTENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: data is null (not undefined, not an error crash)
    expect(result.current.data).toBeNull()
    // AND: no error thrown at hook level — graceful 404 handling
    expect(result.current.isError).toBe(false)
  })

  it('should expose isError=true when API returns 5xx (error propagation)', async () => {
    // GIVEN: MSW simulates a server error
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    )

    // WHEN: hook resolves to error state
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: data is undefined (no partial data on 5xx error)
    expect(result.current.data).toBeUndefined()
  })

  // ─── Disabled when id is null/undefined ───────────────────────────────────

  it('should NOT fetch when id is null (disabled query — AC#2 placeholder state)', async () => {
    // GIVEN: no client selected (null id)

    // WHEN: hook is rendered with null
    const { result } = renderHook(() => useCliente(null), { wrapper: createWrapper() })

    // THEN: query is disabled — no fetch, no loading, data is undefined
    expect(result.current.isLoading).toBe(false)
    // isPending is true for disabled queries, but isLoading (isFetching && isPending) = false
    expect(result.current.isFetching).toBe(false)
  })

  it('should NOT fetch when id is empty string (disabled query)', async () => {
    // GIVEN: empty string id (falsy)

    // WHEN: hook is rendered with empty string
    const { result } = renderHook(() => useCliente(''), { wrapper: createWrapper() })

    // THEN: query is disabled — no fetch triggered
    expect(result.current.isFetching).toBe(false)
  })

  // ─── Query key contract ────────────────────────────────────────────────────

  it('should use queryKey ["clientes", id] per architecture spec', async () => {
    // GIVEN: hook renders with CLIENT_ID

    // WHEN: hook resolves
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: data is returned (verifies MSW handler is matched correctly by queryFn
    // which calls GET /api/v1/clientes/:id — indirect verification of queryKey correctness)
    expect(result.current.data?.id).toBe(CLIENT_ID)
  })

  // ─── Refetch capability ────────────────────────────────────────────────────

  it('should expose a refetch function for manual refresh', async () => {
    // GIVEN: hook resolves with data

    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // THEN: refetch function is present and callable
    expect(typeof result.current.refetch).toBe('function')
  })
})

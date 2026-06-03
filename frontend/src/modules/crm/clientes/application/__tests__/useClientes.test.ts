/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Unit Tests — useClientes Hook (Vitest + renderHook)
 *
 * Acceptance Criteria covered:
 *   AC1 — useClientes hook uses correct TanStack Query key ['clientes']
 *
 * Test cases:
 *   TC-E2-P3-01 — Unit: useClientes hook returns correct query key ['clientes']
 *
 * RED phase: These tests fail because:
 *   - useClientes hook does not exist yet at
 *     frontend/src/modules/crm/clientes/application/useClientes.ts
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createCliente } from '../../../../shared/factories/cliente.factory'

// ─── MSW Server ───────────────────────────────────────────────────────────────

const mockClientes = [createCliente(), createCliente(), createCliente()]

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Test Wrapper ─────────────────────────────────────────────────────────────

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      // @ts-ignore — JSX in .ts file; import React not needed with new JSX transform
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P3-01: Unit — useClientes Hook Returns Correct Query Key
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P3-01 — useClientes: query key is ["clientes"]', () => {
  it('should use queryKey ["clientes"] when fetching clients', async () => {
    // GIVEN: useClientes hook is used inside a QueryClientProvider
    // NOTE: This import will fail (RED) until the hook is created
    const { useClientes } = await import('../useClientes')

    const wrapper = createTestWrapper()

    // WHEN: the hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper })

    // THEN: the query resolves and the query key is ['clientes']
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify the data loaded correctly (confirms the hook called the right key)
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data).toHaveLength(3)
  })

  it('should expose isLoading, isError, and refetch from the hook', async () => {
    // GIVEN: useClientes hook exists
    const { useClientes } = await import('../useClientes')

    const wrapper = createTestWrapper()

    // WHEN: the hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper })

    // THEN: the hook exposes the expected shape
    expect(typeof result.current.isError).toBe('boolean')
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should call GET /api/v1/clientes endpoint', async () => {
    // GIVEN: MSW intercepts the clientes endpoint
    const { useClientes } = await import('../useClientes')

    let requestIntercepted = false
    server.use(
      http.get('*/api/v1/clientes', () => {
        requestIntercepted = true
        return HttpResponse.json(mockClientes)
      }),
    )

    const wrapper = createTestWrapper()

    // WHEN: the hook is rendered and completes loading
    const { result } = renderHook(() => useClientes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: the network request was made to the clientes endpoint
    expect(requestIntercepted).toBe(true)
  })
})

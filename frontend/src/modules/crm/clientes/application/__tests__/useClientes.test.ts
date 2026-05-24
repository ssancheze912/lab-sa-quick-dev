/**
 * Story 2.1: Client List & Search
 * Hook Tests — useClientes (Vitest + RTL + MSW) — RED Phase
 *
 * These tests FAIL until useClientes.ts is implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — useClientes returns a list of clients from GET /api/v1/clientes
 *   AC4 — useClientes exposes isError=true and refetch when the fetch fails
 *
 * Pattern: MSW handler registered before each test (network-first equivalent for unit tests).
 *
 * NOTE: MSW server setup assumes a setupServer instance is created in test-setup.ts
 *       or within this file (inline handlers).
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// SUT — this module does not exist yet (RED phase)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — intentional: module will be created during GREEN phase
import { useClientes } from '../useClientes'

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

let counter = 1

function buildClienteResponse(overrides?: Partial<{
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}>) {
  const idx = counter++
  return {
    id: `00000000-0000-7000-0000-${String(idx).padStart(12, '0')}`,
    nombre: `Cliente Test ${idx}`,
    nit: `90010020${idx}-1`,
    telefono: `3001234${String(idx).padStart(3, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test helper — wrapper with fresh QueryClient per test
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

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — useClientes returns the list from the API
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC1: data fetching', () => {
  it('should return the list of clients when API responds with data', async () => {
    // GIVEN: API returns 3 clients
    const clientes = [buildClienteResponse(), buildClienteResponse(), buildClienteResponse()]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(clientes))
    )

    // WHEN: hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: hook resolves with the 3 clients
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toHaveLength(3)
    expect(result.current.data?.[0].nombre).toBe(clientes[0].nombre)
  })

  it('should return isLoading=true initially before data arrives', async () => {
    // GIVEN: API is slow (we check the initial loading state)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        // Delay to ensure isLoading is captured
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json([])
      })
    )

    // WHEN: hook is rendered (don't await resolution)
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: isLoading is true initially
    expect(result.current.isLoading).toBe(true)
  })

  it('should return isLoading=false after data is loaded', async () => {
    // GIVEN: API responds immediately with an empty list
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: isLoading is false
    expect(result.current.isLoading).toBe(false)
  })

  it('should use queryKey ["clientes"] (never appends search term)', async () => {
    // GIVEN: API returns clients — we verify the queryKey is exactly ['clientes']
    const clientes = [buildClienteResponse()]
    let capturedQueryKey: unknown

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        return HttpResponse.json(clientes)
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { result } = renderHook(() => useClientes(), {
      wrapper: ({ children }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    // THEN: The cached query key is exactly ['clientes']
    const queries = queryClient.getQueriesData({ queryKey: ['clientes'] })
    expect(queries.length).toBeGreaterThan(0)
    capturedQueryKey = queries[0][0]
    expect(capturedQueryKey).toEqual(['clientes'])
  })

  it('should return an empty array when API returns []', async () => {
    // GIVEN: No clients in the system
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    // WHEN: hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: data is an empty array (not undefined, not null)
    expect(result.current.data).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — useClientes exposes isError and refetch on failure
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC4: error handling', () => {
  it('should return isError=true when the API call fails (network error)', async () => {
    // GIVEN: API is unreachable (network error)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    // WHEN: hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: isError is true after the request fails
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isError).toBe(true)
  })

  it('should expose a refetch function that re-triggers the API call', async () => {
    // GIVEN: API initially fails, then succeeds on second call
    let callCount = 0
    const clientes = [buildClienteResponse({ nombre: 'Empresa Recuperada' })]

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(clientes)
      })
    )

    // WHEN: hook renders and fails
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // AND: refetch is called
    await result.current.refetch()

    // THEN: Second call succeeds and data is populated
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(callCount).toBe(2)
    expect(result.current.data?.[0].nombre).toBe('Empresa Recuperada')
  })

  it('should return isError=true when API returns 500', async () => {
    // GIVEN: API returns HTTP 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({ title: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('should expose refetch function regardless of error state', async () => {
    // GIVEN: API is down
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error())
    )

    // WHEN: hook renders
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function')
  })
})

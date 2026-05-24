/**
 * Story 2.1: Client List & Search
 * Unit Tests — useClientes Hook (Vitest + RTL renderHook + MSW)
 *
 * Verifies:
 *   - Hook returns data on successful API response
 *   - Hook returns isError=true on network failure
 *   - Hook uses queryKey: ['clientes'] exactly (required for invalidation in Stories 2.3–2.5)
 *
 * RED Phase: All tests fail until useClientes is implemented.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { useClientes } from './useClientes'

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTES_URL = '/api/v1/clientes'

const mockClientesData = [
  {
    id: 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Empresa Uno',
    nitRuc: '800100100',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bbbb0002-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    nombre: 'Empresa Dos',
    nitRuc: '800200200',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-02-01T00:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get(CLIENTES_URL, () => {
    return HttpResponse.json(mockClientesData)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Create wrapper with fresh QueryClient per test
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
// useClientes — Successful data fetch
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — successful data fetch', () => {
  it('[P1] Given the API returns clients, When useClientes resolves, Then data contains the expected clients', async () => {
    // GIVEN: MSW returns 2 clients
    const wrapper = createWrapper()

    // WHEN: Hook is rendered and query resolves
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: Data contains the expected clients
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].nombre).toBe('Empresa Uno')
    expect(result.current.data![1].nombre).toBe('Empresa Dos')
  })

  it('[P1] Given the API returns clients, When useClientes resolves, Then isLoading is false', async () => {
    // GIVEN: MSW returns 2 clients
    const wrapper = createWrapper()

    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: Loading state is false after resolution
    expect(result.current.isLoading).toBe(false)
  })

  it('[P1] Given the API returns clients, When useClientes resolves, Then isError is false', async () => {
    // GIVEN: MSW returns 2 clients (no error)
    const wrapper = createWrapper()

    // WHEN: Hook resolves successfully
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: Error state is false
    expect(result.current.isError).toBe(false)
  })

  it('[P1] Given the API returns clients, When useClientes resolves, Then each client has id, nombre, nitRuc, telefono, ciudad, createdAt', async () => {
    // GIVEN: MSW returns 2 clients with all required fields
    const wrapper = createWrapper()

    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: All domain fields are present on each client
    const first = result.current.data![0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('nombre')
    expect(first).toHaveProperty('nitRuc')
    expect(first).toHaveProperty('telefono')
    expect(first).toHaveProperty('ciudad')
    expect(first).toHaveProperty('createdAt')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useClientes — Network failure
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — network failure', () => {
  it('[P1] Given the API is unavailable, When useClientes rejects, Then isError is true', async () => {
    // GIVEN: MSW configured to return a network error
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.error()
      })
    )

    const wrapper = createWrapper()

    // WHEN: Hook runs and the network request fails
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
  })

  it('[P1] Given the API is unavailable, When useClientes rejects, Then data is undefined', async () => {
    // GIVEN: MSW returns network error
    server.use(
      http.get(CLIENTES_URL, () => {
        return HttpResponse.error()
      })
    )

    const wrapper = createWrapper()

    // WHEN: Network failure
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: Data is not populated on error
    expect(result.current.data).toBeUndefined()
  })

  it('[P1] Given the API returns a 500 error, When useClientes rejects, Then isError is true', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(
      http.get(CLIENTES_URL, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const wrapper = createWrapper()

    // WHEN: Hook encounters a server error
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useClientes — queryKey contract (critical: used by mutations 2.3–2.5)
// ─────────────────────────────────────────────────────────────────────────────

describe("useClientes — queryKey must be ['clientes']", () => {
  it("[P1] Given useClientes runs, When the query is registered, Then queryKey is exactly ['clientes']", async () => {
    // GIVEN: Fresh QueryClient that allows us to inspect the cache
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // WHEN: Hook is rendered and query executes
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: The queryKey in the cache is exactly ['clientes']
    const queries = queryClient.getQueryCache().getAll()
    const clientesQuery = queries.find(
      (q) => JSON.stringify(q.queryKey) === JSON.stringify(['clientes'])
    )

    expect(clientesQuery).toBeDefined()
    expect(clientesQuery?.queryKey).toEqual(['clientes'])
  })

  it('[P1] Given useClientes runs, When data loads, Then refetch function is available', async () => {
    // GIVEN: MSW returns 2 clients
    const wrapper = createWrapper()

    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: refetch function is exposed (required by AC4 — ErrorPanel retry)
    expect(typeof result.current.refetch).toBe('function')
  })
})

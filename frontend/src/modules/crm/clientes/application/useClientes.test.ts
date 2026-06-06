/**
 * Story 2.1: Client List & Search
 * Unit tests for useClientes application hook
 *
 * Acceptance Criteria covered: AC1 (data loading), AC5 (error state / refetch), AC6 (loading state)
 *
 * NOTE: Tests are in RED state — they will fail until useClientes.ts,
 * clienteApiRepository.ts, and GET /api/v1/clientes are implemented.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createElement } from 'react'

// ─── MSW server setup ────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5000'

const mockClientes = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Constructora Andina S.A.S',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Inversiones del Norte Ltda',
    nit: '800654321-2',
    telefono: '3019876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes`, () => {
    return HttpResponse.json(mockClientes)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Test wrapper helpers ─────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
}

function createWrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useClientes — happy path', () => {
  /**
   * AC1: Given there are clients in the system,
   * When the hook is called,
   * Then it returns a Cliente[] array with all clients.
   *
   * RED: will fail until useClientes.ts + clienteApiRepository.ts exist.
   */
  it('returns an array of clientes on successful fetch', async () => {
    // Arrange
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    const { useClientes } = await import('./useClientes')

    // Act
    const { result } = renderHook(() => useClientes(), { wrapper })

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].nombre).toBe('Constructora Andina S.A.S')
    expect(result.current.data?.[0].nit).toBe('900123456-1')
    expect(result.current.isError).toBe(false)
  })

  /**
   * AC1: Each returned item has the full Cliente shape.
   */
  it('each returned cliente has all required fields', async () => {
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    const { useClientes } = await import('./useClientes')
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    const cliente = result.current.data?.[0]
    expect(cliente).toHaveProperty('id')
    expect(cliente).toHaveProperty('nombre')
    expect(cliente).toHaveProperty('nit')
    expect(cliente).toHaveProperty('telefono')
    expect(cliente).toHaveProperty('ciudad')
    expect(cliente).toHaveProperty('createdAt')
    expect(cliente).toHaveProperty('updatedAt')
  })
})

describe('useClientes — loading state', () => {
  /**
   * AC6: Given the component is mounting,
   * When the first fetch is in progress,
   * Then isLoading is true.
   *
   * RED: will fail until useClientes.ts exposes isLoading from useQuery.
   */
  it('isLoading is true while the fetch is in progress', async () => {
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    // Override with a delayed response to capture loading state
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(mockClientes)
      })
    )

    const { useClientes } = await import('./useClientes')
    const { result } = renderHook(() => useClientes(), { wrapper })

    // Immediately after mount, before response arrives
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for completion
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})

describe('useClientes — error state', () => {
  /**
   * AC5: Given the backend is unavailable when the page loads,
   * When the GET /api/v1/clientes fetch fails,
   * Then isError is true.
   *
   * RED: will fail until useClientes.ts exposes isError from useQuery.
   */
  it('isError is true on network failure', async () => {
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        return HttpResponse.error()
      })
    )

    const { useClientes } = await import('./useClientes')
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  /**
   * AC5: Given a fetch failure,
   * When refetch() is called,
   * Then it re-triggers the query (isLoading becomes true again).
   *
   * RED: will fail until useClientes.ts exposes refetch from useQuery.
   */
  it('refetch re-triggers the query and can recover to success', async () => {
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    // First call fails
    let callCount = 0
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes`, () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(mockClientes)
      })
    )

    const { useClientes } = await import('./useClientes')
    const { result } = renderHook(() => useClientes(), { wrapper })

    // Wait for initial error
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Act: call refetch
    await result.current.refetch()

    // Assert: data is now available
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })
    expect(callCount).toBe(2)
  })

  /**
   * AC5: useClientes exposes a refetch function.
   */
  it('exposes a refetch function', async () => {
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    const { useClientes } = await import('./useClientes')
    const { result } = renderHook(() => useClientes(), { wrapper })

    expect(typeof result.current.refetch).toBe('function')
  })
})

describe('useClientes — TanStack Query key', () => {
  /**
   * Ensures the canonical query key ['clientes'] is used so that
   * mutations in Stories 2.3–2.5 can invalidate it.
   *
   * RED: will fail until useClientes.ts uses queryKey: ['clientes'].
   */
  it("uses canonical query key ['clientes']", async () => {
    const qc = createTestQueryClient()
    const wrapper = createWrapper(qc)

    const { useClientes } = await import('./useClientes')
    renderHook(() => useClientes(), { wrapper })

    // After mount the key should be present in the query cache
    await waitFor(() => {
      const queries = qc.getQueryCache().findAll({ queryKey: ['clientes'] })
      expect(queries.length).toBeGreaterThan(0)
    })
  })
})

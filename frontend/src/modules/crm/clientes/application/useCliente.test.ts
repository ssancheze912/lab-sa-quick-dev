/**
 * Story 2.2: Client Detail View
 * Unit Tests — useCliente Hook (Vitest + RTL renderHook + MSW)
 *
 * Test Cases Covered:
 *   - Hook returns data when MSW returns client by id
 *   - Hook returns isError=true with status 404 when MSW returns 404
 *   - Hook uses queryKey: ['clientes', id] exactly (canonical key per architecture)
 *   - Hook returns refetch function (required by AC error retry)
 *
 * RED Phase: All tests fail until useCliente and its dependencies are implemented.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createElement } from 'react'
import { useCliente } from './useCliente'

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ID = 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const CLIENTE_URL = `/api/v1/clientes/${TEST_ID}`
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000'

const mockCliente = {
  id: TEST_ID,
  nombre: 'Empresa Detalle Test',
  nitRuc: '900111222',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get(`/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === NON_EXISTENT_ID) {
      return new HttpResponse(
        JSON.stringify({ status: 404, title: 'Cliente no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
      )
    }
    if (params.id === TEST_ID) {
      return HttpResponse.json(mockCliente)
    }
    return new HttpResponse(null, { status: 404 })
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
// useCliente — Successful data fetch
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — successful data fetch', () => {
  it('[P1] Given MSW returns a client by id, When useCliente resolves, Then data contains the expected client', async () => {
    // GIVEN: MSW returns the client for TEST_ID
    const wrapper = createWrapper()

    // WHEN: Hook is rendered and query resolves
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: Data contains the expected client
    expect(result.current.data?.nombre).toBe('Empresa Detalle Test')
    expect(result.current.data?.nitRuc).toBe('900111222')
    expect(result.current.data?.telefono).toBe('3001234567')
    expect(result.current.data?.ciudad).toBe('Bogotá')
  })

  it('[P1] Given MSW returns a client by id, When useCliente resolves, Then isLoading is false', async () => {
    // GIVEN: MSW returns a client
    const wrapper = createWrapper()

    // WHEN: Hook resolves
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: Loading state is false
    expect(result.current.isLoading).toBe(false)
  })

  it('[P1] Given MSW returns a client by id, When useCliente resolves, Then isError is false', async () => {
    // GIVEN: MSW returns a client (no error)
    const wrapper = createWrapper()

    // WHEN: Hook resolves successfully
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: Error state is false
    expect(result.current.isError).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useCliente — 404 Not Found
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — 404 not found', () => {
  it('[P1] Given MSW returns 404, When useCliente rejects, Then isError is true', async () => {
    // GIVEN: MSW configured to return 404 for the non-existent id
    const wrapper = createWrapper()

    // WHEN: Hook runs and the API returns 404
    const { result } = renderHook(() => useCliente(NON_EXISTENT_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: isError is true
    expect(result.current.isError).toBe(true)
  })

  it('[P1] Given MSW returns 404, When useCliente rejects, Then error response status is 404', async () => {
    // GIVEN: MSW returns 404 for non-existent client id
    const wrapper = createWrapper()

    // WHEN: Hook runs and receives a 404 response
    const { result } = renderHook(() => useCliente(NON_EXISTENT_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: The error has HTTP status 404 (AxiosError pattern)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (result.current.error as any)?.response?.status
    expect(status).toBe(404)
  })

  it('[P1] Given MSW returns 404, When useCliente rejects, Then data is undefined', async () => {
    // GIVEN: MSW returns 404
    const wrapper = createWrapper()

    // WHEN: 404 occurs
    const { result } = renderHook(() => useCliente(NON_EXISTENT_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: Data is not populated on error
    expect(result.current.data).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useCliente — queryKey contract (critical: must be ['clientes', id])
// ─────────────────────────────────────────────────────────────────────────────

describe("useCliente — queryKey must be ['clientes', id]", () => {
  it("[P1] Given useCliente runs, When the query is registered, Then queryKey is exactly ['clientes', id]", async () => {
    // GIVEN: Fresh QueryClient that allows inspecting the cache
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // WHEN: Hook is rendered and query executes
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: The queryKey in the cache is exactly ['clientes', id]
    const queries = queryClient.getQueryCache().getAll()
    const clienteQuery = queries.find(
      (q) => JSON.stringify(q.queryKey) === JSON.stringify(['clientes', TEST_ID])
    )

    expect(clienteQuery).toBeDefined()
    expect(clienteQuery?.queryKey).toEqual(['clientes', TEST_ID])
  })

  it('[P1] Given useCliente runs, When data loads, Then refetch function is available', async () => {
    // GIVEN: MSW returns a client
    const wrapper = createWrapper()

    // WHEN: Hook resolves
    const { result } = renderHook(() => useCliente(TEST_ID), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: refetch function is exposed
    expect(typeof result.current.refetch).toBe('function')
  })
})

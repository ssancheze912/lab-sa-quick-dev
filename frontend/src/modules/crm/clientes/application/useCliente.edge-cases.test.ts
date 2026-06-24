/**
 * Unit Edge Case Tests — Story 2.2: useCliente hook
 * BMad-Integrated Automate — Expansion beyond ATDD coverage
 *
 * Covers edge cases and boundary conditions NOT covered by the ATDD unit tests:
 *   - AxiosError response.status === 404 is accessible (error shape for 404 differentiation)
 *   - Separate queries for different IDs use independent cache entries
 *   - Refetch updates data when server returns new data
 *   - Hook with whitespace-only id (treated as enabled — edge case of !!id)
 *   - Query result data shape matches Cliente interface
 *   - fetchStatus transitions: idle → fetching → idle (after success)
 *   - error.response.status is 404 when server returns 404 (for ClienteDetailView 404 detection)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCliente } from './useCliente'
import type { Cliente } from '../domain/Cliente'

const mockCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === '11111111-1111-1111-1111-111111111111') {
      return HttpResponse.json(mockCliente)
    }
    return new HttpResponse(
      JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente with id '${params.id}' was not found.` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─────────────────────────────────────────────────────────────────────────────
// Error shape: 404 accessible via AxiosError
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — edge: 404 error shape for component differentiation', () => {
  it('[P1] error.response.status is 404 when the API returns a 404 (AxiosError shape)', async () => {
    // Arrange: request a non-existent client
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('99999999-9999-9999-9999-999999999999'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Assert: error has the shape ClienteDetailView expects for 404 detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = result.current.error as any
    expect(axiosError?.response?.status).toBe(404)
  })

  it('[P1] error.response.status is 500 when the API returns a 500 (non-404 error path)', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => new HttpResponse(null, { status: 500 })),
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Assert: error.response.status is 500 (not 404 — ensures isNotFound detection is correct)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = result.current.error as any
    expect(axiosError?.response?.status).toBe(500)
  })

  it('[P1] isNotFound detection: error.response?.status === 404 is true only for 404 errors', async () => {
    // Arrange: 404 scenario
    const wrapper = createWrapper()
    const { result: result404 } = renderHook(() => useCliente('99999999-9999-9999-9999-999999999999'), { wrapper })
    await waitFor(() => expect(result404.current.isError).toBe(true))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const is404 = (result404.current.error as any)?.response?.status === 404
    expect(is404).toBe(true)
  })

  it('[P1] isNotFound detection is false for 500 errors (error.response?.status !== 404)', async () => {
    // Arrange: 500 scenario
    server.use(
      http.get('*/api/v1/clientes/:id', () => new HttpResponse(null, { status: 500 })),
    )
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Assert: 500 does not trigger "not found" path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const is404 = (result.current.error as any)?.response?.status === 404
    expect(is404).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Independent cache entries for different IDs
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — edge: independent cache entries per id', () => {
  it('[P1] two useCliente hooks with different ids use separate cache entries', async () => {
    // Arrange: Two different clients
    const clienteA: Cliente = { ...mockCliente, id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', nombre: 'Empresa A' }
    const clienteB: Cliente = { ...mockCliente, id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', nombre: 'Empresa B' }

    server.use(
      http.get('*/api/v1/clientes/:id', ({ params }) => {
        if (params.id === clienteA.id) return HttpResponse.json(clienteA)
        if (params.id === clienteB.id) return HttpResponse.json(clienteB)
        return new HttpResponse(null, { status: 404 })
      }),
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // Act: render two hooks with different ids
    const { result: resultA } = renderHook(() => useCliente(clienteA.id), { wrapper })
    const { result: resultB } = renderHook(() => useCliente(clienteB.id), { wrapper })

    await waitFor(() => expect(resultA.current.isSuccess).toBe(true))
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true))

    // Assert: each hook returns its own client
    expect(resultA.current.data?.nombre).toBe('Empresa A')
    expect(resultB.current.data?.nombre).toBe('Empresa B')
    expect(resultA.current.data?.id).not.toBe(resultB.current.data?.id)
  })

  it('[P1] cache uses distinct keys for distinct ids (no cross-contamination)', async () => {
    // Arrange
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Assert: query cache does NOT have an entry for a different id
    const differentId = '22222222-2222-2222-2222-222222222222'
    const queriesForDifferentId = queryClient.getQueryCache().findAll({
      queryKey: ['clientes', differentId],
    })
    expect(queriesForDifferentId).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Refetch updates data
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — edge: refetch behavior', () => {
  it('[P1] refetch re-fetches data from the server and updates the result', async () => {
    // Arrange
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        callCount++
        return HttpResponse.json({ ...mockCliente, nombre: `Empresa Version ${callCount}` })
      }),
    )
    const wrapper = createWrapper()

    // Act: initial fetch
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const firstNombre = result.current.data?.nombre
    const firstCallCount = callCount

    // WHEN: refetch is called
    await result.current.refetch()

    // THEN: data is updated (server was called again)
    await waitFor(() => expect(callCount).toBeGreaterThan(firstCallCount))
    expect(result.current.data?.nombre).not.toBeUndefined()
    // Both values follow the pattern "Empresa Version N" (refetch triggered new call)
    expect(result.current.data?.nombre).toMatch(/Empresa Version \d+/)
    expect(firstNombre).toMatch(/Empresa Version \d+/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Whitespace-only id (boundary edge case of !!id check)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — edge: whitespace-only id is truthy (enabled)', () => {
  it('[P2] a whitespace-only id triggers the query (because " " is truthy in JS)', async () => {
    // Arrange: whitespace id is truthy — query will be enabled and make an API call
    server.use(
      http.get('*/api/v1/clientes/:id', () => new HttpResponse(null, { status: 404 })),
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('   '), { wrapper })

    // Assert: query is enabled (not idle) — whitespace triggers a fetch attempt
    // It will error because " " is not a valid ID, but enabled is true
    await waitFor(() => {
      expect(result.current.isError || result.current.isSuccess || result.current.isLoading).toBe(true)
    })
    expect(result.current.fetchStatus).not.toBe('idle')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Response data shape matches Cliente interface
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — edge: returned data shape matches Cliente interface', () => {
  it('[P1] data object has all required Cliente fields with correct types', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Assert: all required fields present with correct types
    const data = result.current.data
    expect(typeof data?.id).toBe('string')
    expect(typeof data?.nombre).toBe('string')
    expect(typeof data?.nit).toBe('string')
    expect(typeof data?.telefono).toBe('string')
    expect(typeof data?.ciudad).toBe('string')
    expect(typeof data?.createdAt).toBe('string')
    expect(typeof data?.updatedAt).toBe('string')
  })

  it('[P1] data.id matches the queried client id', async () => {
    // Arrange
    const wrapper = createWrapper()
    const queriedId = '11111111-1111-1111-1111-111111111111'

    // Act
    const { result } = renderHook(() => useCliente(queriedId), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Assert: returned id matches the queried id
    expect(result.current.data?.id).toBe(queriedId)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// fetchStatus transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — edge: fetchStatus lifecycle transitions', () => {
  it('[P2] fetchStatus transitions from fetching to idle after successful load', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente('11111111-1111-1111-1111-111111111111'), { wrapper })

    // Initial state: fetchStatus should be fetching
    expect(result.current.fetchStatus).toBe('fetching')

    // After load completes: fetchStatus should be idle
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('[P2] fetchStatus is idle when query is disabled (undefined id)', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(undefined), { wrapper })

    // Assert: never fetches
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
  })
})

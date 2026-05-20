import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Cliente } from '../../domain/Cliente'

vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
  },
}))

import { clienteApiRepository } from '../../infrastructure/clienteApiRepository'
import { useClientes } from '../useClientes'

const mockGetAll = clienteApiRepository.getAll as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  }
}

/**
 * Edge case unit tests for useClientes hook — Story 2.1 expansion.
 *
 * Test IDs: UNIT-C-FE-UC-01 … UNIT-C-FE-UC-06
 */
describe('useClientes — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UC-01: Returns an empty array (not undefined) when API returns []
  // Boundary: filteredClientes in ClienteListPanel defaults to [] but hook data
  // could be undefined on first render — the defaultValue [] in useClientes covers this.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UC-01 — returns empty array when API responds with empty list', async () => {
    mockGetAll.mockResolvedValueOnce([])

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UC-02: isLoading is true before the first response arrives
  // Boundary: loading state must be set immediately on mount.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UC-02 — isLoading is true before first response arrives', async () => {
    let resolvePromise!: (value: Cliente[]) => void
    const pendingPromise = new Promise<Cliente[]>((resolve) => { resolvePromise = resolve })
    mockGetAll.mockReturnValueOnce(pendingPromise)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    // Release the promise so the test does not hang
    act(() => { resolvePromise([]) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UC-03: data is undefined while loading (before first resolution)
  // Boundary: consumer code using `data = []` fallback pattern is safe.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UC-03 — data is undefined while isLoading is true', async () => {
    let resolvePromise!: (value: Cliente[]) => void
    const pendingPromise = new Promise<Cliente[]>((resolve) => { resolvePromise = resolve })
    mockGetAll.mockReturnValueOnce(pendingPromise)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    expect(result.current.data).toBeUndefined()

    act(() => { resolvePromise([]) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UC-04: refetch triggers a new call to repository.getAll()
  // Boundary: the retry mechanism in ClienteListPanel uses refetch().
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UC-04 — refetch calls repository.getAll() a second time', async () => {
    const mockData: Cliente[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        nombre: 'Empresa Refetch',
        nit: '900100001-0',
        telefono: '+57 1 234 5678',
        ciudad: 'Bogotá',
        createdAt: '2026-05-20T10:00:00Z',
        updatedAt: '2026-05-20T10:00:00Z',
      },
    ]
    mockGetAll.mockResolvedValue(mockData)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAll).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockGetAll).toHaveBeenCalledTimes(2)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UC-05: Uses queryKey ['clientes'] — correct cache key
  // Boundary: if queryKey changes the cache will be fragmented; it must stay stable.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UC-05 — uses correct queryKey ["clientes"]', async () => {
    mockGetAll.mockResolvedValueOnce([])

    const { wrapper, queryClient } = createWrapper()
    renderHook(() => useClientes(), { wrapper })

    await waitFor(() =>
      expect(queryClient.getQueryState(['clientes'])?.status).toBe('success')
    )
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UC-06: Multiple renders share the same cached data (no duplicate fetches)
  // Boundary: staleTime ensures the cache is reused within 5 minutes; with staleTime=0
  // in tests a refetch would occur, but two concurrent renders share one inflight request.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UC-06 — two concurrent hook instances do not trigger two separate fetches', async () => {
    const mockData: Cliente[] = []
    mockGetAll.mockResolvedValue(mockData)

    const { wrapper } = createWrapper()

    // Render two hooks simultaneously in the same provider
    const { result: r1 } = renderHook(() => useClientes(), { wrapper })
    const { result: r2 } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    // React Query deduplicates — should be called at most once for concurrent renders
    expect(mockGetAll).toHaveBeenCalledTimes(1)
  })
})

/**
 * Edge Case Tests — Story 3.1: useContactos hook
 * Unit tests for edge cases beyond ATDD suite (UNIT-CT-FE-01, UNIT-CT-FE-02).
 *
 * Test IDs: UNIT-CT-FE-UC-01 … UNIT-CT-FE-UC-06
 *
 * Risks covered:
 *   - Returns empty array (not undefined) when API responds with []
 *   - isLoading is true before first response (skeleton trigger guard)
 *   - data is undefined while isLoading is true
 *   - refetch triggers a new repository.getAll() call (ErrorPanel retry path)
 *   - queryKey is ['contactos'] — correct cache key stability
 *   - Two concurrent hook instances do not trigger duplicate fetches
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Contacto } from '../../domain/Contacto'

vi.mock('../../infrastructure/contactoApiRepository', () => ({
  contactoApiRepository: {
    getAll: vi.fn(),
  },
}))

import { contactoApiRepository } from '../../infrastructure/contactoApiRepository'
import { useContactos } from '../useContactos'

const mockGetAll = contactoApiRepository.getAll as ReturnType<typeof vi.fn>

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

describe('useContactos — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-UC-01: Returns an empty array (not undefined) when API returns []
  // Boundary: ContactoListView defaults data to [] with `data = []` pattern.
  // Must confirm data is [] not undefined on empty response.
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-UC-01 — returns empty array when API responds with empty list', async () => {
    mockGetAll.mockResolvedValueOnce([])

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useContactos(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-UC-02: isLoading is true before the first response arrives
  // Boundary: skeleton loading state must trigger immediately on mount.
  // ContactoListView renders 3 skeleton rows when isLoading is true.
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-UC-02 — isLoading is true before first response arrives', async () => {
    let resolvePromise!: (value: Contacto[]) => void
    const pendingPromise = new Promise<Contacto[]>((resolve) => {
      resolvePromise = resolve
    })
    mockGetAll.mockReturnValueOnce(pendingPromise)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useContactos(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    // Release promise to avoid test hang
    act(() => {
      resolvePromise([])
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-UC-03: data is undefined while isLoading is true
  // Boundary: consumer code using `data = []` default is safe because data
  // is undefined on first render before the fetch resolves.
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-UC-03 — data is undefined while isLoading is true', async () => {
    let resolvePromise!: (value: Contacto[]) => void
    const pendingPromise = new Promise<Contacto[]>((resolve) => {
      resolvePromise = resolve
    })
    mockGetAll.mockReturnValueOnce(pendingPromise)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useContactos(), { wrapper })

    expect(result.current.data).toBeUndefined()

    act(() => {
      resolvePromise([])
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-UC-04: refetch triggers a new call to repository.getAll()
  // Boundary: the ErrorPanel retry button calls refetch() from useContactos.
  // Must verify that refetch results in a new getAll() invocation.
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-UC-04 — refetch calls repository.getAll() a second time', async () => {
    const mockData: Contacto[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        nombre: 'Refetch Contacto',
        cargo: 'Analista',
        telefono: '+57 310 000 0001',
        email: 'refetch@empresa.com',
        clienteId: null,
        createdAt: '2026-05-21T10:00:00Z',
        updatedAt: '2026-05-21T10:00:00Z',
      },
    ]
    mockGetAll.mockResolvedValue(mockData)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useContactos(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAll).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockGetAll).toHaveBeenCalledTimes(2)
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-UC-05: Uses queryKey ['contactos'] — correct cache key
  // Boundary: if queryKey changes the cache will fragment across components.
  // The key must be the exact array ['contactos'] — no string variant.
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-UC-05 — uses correct queryKey ["contactos"]', async () => {
    mockGetAll.mockResolvedValueOnce([])

    const { wrapper, queryClient } = createWrapper()
    renderHook(() => useContactos(), { wrapper })

    await waitFor(() =>
      expect(queryClient.getQueryState(['contactos'])?.status).toBe('success')
    )
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-UC-06: Two concurrent hook instances share the same cache
  // Boundary: TanStack Query deduplicates concurrent requests for the same key.
  // Two simultaneous renders in the same provider must fire only ONE getAll() call.
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-UC-06 — two concurrent hook instances do not trigger two separate fetches', async () => {
    mockGetAll.mockResolvedValue([])

    const { wrapper } = createWrapper()

    const { result: r1 } = renderHook(() => useContactos(), { wrapper })
    const { result: r2 } = renderHook(() => useContactos(), { wrapper })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    // React Query deduplicates concurrent inflight requests for the same queryKey
    expect(mockGetAll).toHaveBeenCalledTimes(1)
  })
})

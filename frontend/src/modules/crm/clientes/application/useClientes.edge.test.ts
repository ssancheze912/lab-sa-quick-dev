// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases — Story 2.1: useClientes Hook
// Test Level: Unit (Vitest + @testing-library/react renderHook)
// Mode: BMad-Integrated (expands ATDD coverage with edge cases NOT in
//       useClientes.test.ts)
//
// Coverage added here:
//   - isLoading=true before promise resolves (initial state boundary)
//   - refetch triggers a second repository call
//   - Concurrent re-renders do not duplicate getAll calls (query dedup)
//   - Repository throwing a non-Error value (string) still sets isError
//   - Data type is Client[] not a wrapped object (no .data.data nesting)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createClientes } from '../../../../test-support/factories/cliente.factory'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import { useClientes } from './useClientes'

const mockGetAll = clienteApiRepository.getAll as ReturnType<typeof vi.fn>

// ── Wrapper factory ───────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — edge cases', () => {
  it('isLoading=true immediately on first render before promise resolves', async () => {
    // GIVEN: Repository never resolves (pending promise)
    let resolve: (v: unknown) => void = () => {}
    mockGetAll.mockReturnValue(new Promise((r) => { resolve = r }))

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: isLoading is true synchronously (before resolution)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Cleanup: resolve to avoid hanging
    act(() => { resolve([]) })
  })

  it('refetch triggers a second call to clienteApiRepository.getAll', async () => {
    // GIVEN: Repository resolves immediately
    mockGetAll.mockResolvedValue([])

    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Baseline: called once on mount
    expect(mockGetAll).toHaveBeenCalledTimes(1)

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: getAll is called a second time
    expect(mockGetAll).toHaveBeenCalledTimes(2)
  })

  it('does not duplicate getAll calls on re-render (TanStack Query dedup)', async () => {
    // GIVEN: Repository resolves with data
    const clientes = createClientes(2)
    mockGetAll.mockResolvedValue(clientes)

    const { result, rerender } = renderHook(() => useClientes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // WHEN: Component re-renders (same query key — should use cache)
    rerender()
    rerender()

    // THEN: getAll was called only once (cached result reused)
    expect(mockGetAll).toHaveBeenCalledTimes(1)
  })

  it('sets isError=true when repository rejects with a string (non-Error throw)', async () => {
    // GIVEN: Repository rejects with a plain string (not an Error object)
    mockGetAll.mockRejectedValue('Repository unavailable')

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: isError becomes true regardless of rejection type
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('data is a flat array — not nested under a .data property', async () => {
    // GIVEN: Repository returns an array
    const clientes = createClientes(2)
    mockGetAll.mockResolvedValue(clientes)

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: result.current.data is the array directly — no .data.data nesting
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data).toHaveLength(2)
  })

  it('isError resets to false after successful refetch following an error', async () => {
    // GIVEN: First call fails, second succeeds
    const clientes = createClientes(1)
    mockGetAll
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(clientes)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    const { result } = renderHook(() => useClientes(), { wrapper })

    // Wait for error state
    await waitFor(() => expect(result.current.isError).toBe(true))

    // WHEN: refetch succeeds
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: isError is false, data is populated
    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(result.current.data).toEqual(clientes)
  })
})

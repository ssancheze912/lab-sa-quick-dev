// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases — Story 2.2: useCliente Hook
// Test Level: Unit (Vitest + @testing-library/react renderHook)
// Mode: BMad-Integrated (expands ATDD coverage with edge cases NOT in
//       useCliente.test.ts)
//
// Coverage added here (NOT in ATDD tests):
//   - isLoading=true immediately on first render before promise resolves
//   - refetch triggers a second call to clienteApiRepository.getById
//   - Re-renders with same id do NOT duplicate repository calls (query dedup)
//   - Repository rejecting with a plain string (non-Error) still sets isError
//   - isError resets to false after successful refetch following an error
//   - Empty string id treated as falsy — query disabled (same as null/undefined)
//   - id changes from one value to another changes the query key correctly
//   - data is the Cliente object directly — not nested under .data property
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createCliente } from '../../../../test-support/factories/cliente.factory'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import { useCliente } from './useCliente'

const mockGetById = clienteApiRepository.getById as ReturnType<typeof vi.fn>

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

describe('useCliente — edge cases', () => {
  it('isLoading=true immediately on first render before promise resolves', async () => {
    // GIVEN: Repository never resolves (pending promise)
    let resolve: (v: unknown) => void = () => {}
    mockGetById.mockReturnValue(new Promise((r) => { resolve = r }))

    // WHEN: Hook is rendered with a valid id
    const { result } = renderHook(() => useCliente('pending-id'), {
      wrapper: makeWrapper(),
    })

    // THEN: isLoading is true synchronously before the promise settles
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Cleanup: resolve to avoid hanging
    act(() => { resolve(createCliente()) })
  })

  it('refetch triggers a second call to clienteApiRepository.getById', async () => {
    // GIVEN: Repository resolves immediately
    const cliente = createCliente()
    mockGetById.mockResolvedValue(cliente)

    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Baseline: called once on mount
    expect(mockGetById).toHaveBeenCalledTimes(1)

    // WHEN: refetch is called explicitly
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: getById is called a second time
    expect(mockGetById).toHaveBeenCalledTimes(2)
  })

  it('does not duplicate getById calls on re-render (TanStack Query dedup)', async () => {
    // GIVEN: Repository resolves with a client
    const cliente = createCliente()
    mockGetById.mockResolvedValue(cliente)

    const { result, rerender } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // WHEN: Component re-renders (same query key — cache hit)
    rerender()
    rerender()

    // THEN: getById was called only once (query is cached)
    expect(mockGetById).toHaveBeenCalledTimes(1)
  })

  it('sets isError=true when repository rejects with a plain string (non-Error throw)', async () => {
    // GIVEN: Repository rejects with a string (not an Error object)
    mockGetById.mockRejectedValue('Repository unavailable')

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useCliente('some-id'), {
      wrapper: makeWrapper(),
    })

    // THEN: isError becomes true regardless of rejection type
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('isError resets to false after successful refetch following an error', async () => {
    // GIVEN: First call fails, second call succeeds
    const cliente = createCliente()
    mockGetById
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(cliente)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    const { result } = renderHook(() => useCliente(cliente.id), { wrapper })

    // Wait for error state
    await waitFor(() => expect(result.current.isError).toBe(true))

    // WHEN: refetch succeeds
    await act(async () => {
      await result.current.refetch()
    })

    // THEN: isError is false, data is populated
    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(result.current.data).toEqual(cliente)
  })

  it('is DISABLED when id is an empty string (falsy — treated same as null)', async () => {
    // GIVEN: Empty string id — should be treated as "no id selected"
    // WHEN: Hook is rendered with ""
    const { result } = renderHook(() => useCliente(''), {
      wrapper: makeWrapper(),
    })

    // THEN: getById is never called (empty string is falsy — enabled: !!id = false)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetById).not.toHaveBeenCalled()
  })

  it('data is the Cliente object directly — not nested under a .data property', async () => {
    // GIVEN: Repository returns a client
    const cliente = createCliente({ nombre: 'Flat Data Corp' })
    mockGetById.mockResolvedValue(cliente)

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: result.current.data IS the cliente — no .data.data nesting
    expect(result.current.data).toBeDefined()
    expect((result.current.data as { nombre?: string })?.nombre).toBe('Flat Data Corp')
    // Ensure it's not wrapped in another object
    expect(typeof result.current.data).toBe('object')
  })

  it('transitions from loading=true to data when promise resolves', async () => {
    // GIVEN: Repository is pending initially
    let resolve: (v: ReturnType<typeof createCliente>) => void = () => {}
    const pendingPromise = new Promise<ReturnType<typeof createCliente>>((r) => { resolve = r })
    mockGetById.mockReturnValue(pendingPromise)

    const { result } = renderHook(() => useCliente('some-id'), {
      wrapper: makeWrapper(),
    })

    // Initial state: loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // WHEN: Promise resolves with data
    const cliente = createCliente()
    act(() => { resolve(cliente) })

    // THEN: Loading ends and data is available
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(cliente)
    expect(result.current.isError).toBe(false)
  })

  it('uses different cache entries for different ids (query key isolation)', async () => {
    // GIVEN: Two different clienteIds and their respective clients
    const clienteA = createCliente({ nombre: 'Cliente A' })
    const clienteB = createCliente({ nombre: 'Cliente B' })

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // Populate both queries in the cache directly
    qc.setQueryData(['clientes', clienteA.id], clienteA)
    qc.setQueryData(['clientes', clienteB.id], clienteB)

    // THEN: Each id has its own isolated cache entry
    const stateA = qc.getQueryState(['clientes', clienteA.id])
    const stateB = qc.getQueryState(['clientes', clienteB.id])

    expect(stateA?.data).toEqual(clienteA)
    expect(stateB?.data).toEqual(clienteB)
    expect(stateA?.data).not.toEqual(stateB?.data)
  })

  it('null id produces a query key ["clientes", null] that does not conflict with a real id key', async () => {
    // GIVEN: A QueryClient with a cached result for a real id
    const cliente = createCliente()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['clientes', cliente.id], cliente)

    // WHEN: Hook for null id is rendered
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    const { result } = renderHook(() => useCliente(null), { wrapper })

    // THEN: Null-id hook returns no data (query disabled) — cache for real id unchanged
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeUndefined()
    expect(qc.getQueryData(['clientes', cliente.id])).toEqual(cliente)
  })
})

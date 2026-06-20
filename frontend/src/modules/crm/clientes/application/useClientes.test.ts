// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.1: Client List & Search
// Test Level: Unit (Vitest + @testing-library/react renderHook)
// Phase: RED — fails until useClientes.ts and clienteApiRepository.ts exist
//
// Acceptance Criteria covered:
//   AC1 — useClientes returns client data from GET /api/v1/clientes
//   AC4 — isError=true when the repository throws
//
// Also validates:
//   - Correct TanStack Query key: ['clientes']
//   - refetch is exposed in the return value
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createClientes } from '../../../../test-support/factories/cliente.factory'

// ── Mock repository ───────────────────────────────────────────────────────────
// The hook imports clienteApiRepository.getAll; we mock it at module level.
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

describe('useClientes — TanStack Query hook', () => {
  it('returns data when repository resolves with a client list', async () => {
    // GIVEN: The repository returns 3 clients
    const clientes = createClientes(3)
    mockGetAll.mockResolvedValue(clientes)

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: data equals the resolved array
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(clientes)
    expect(result.current.isError).toBe(false)
  })

  it('returns an empty array when the repository returns []', async () => {
    // GIVEN: The repository returns an empty list
    mockGetAll.mockResolvedValue([])

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: data is an empty array (not undefined)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('sets isError=true when the repository rejects', async () => {
    // GIVEN: The repository throws a network error
    mockGetAll.mockRejectedValue(new Error('Network Error'))

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: isError becomes true; data remains undefined
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('exposes a refetch function in its return value', async () => {
    // GIVEN: The repository resolves
    mockGetAll.mockResolvedValue([])

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function')
  })

  it('uses the canonical query key ["clientes"]', async () => {
    // GIVEN: A QueryClient with a spy on getQueryState
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockGetAll.mockResolvedValue([])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    // WHEN: The hook is rendered and data is loaded
    const { result } = renderHook(() => useClientes(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: The query state exists under the ['clientes'] key
    const queryState = qc.getQueryState(['clientes'])
    expect(queryState).not.toBeUndefined()
    expect(queryState?.status).toBe('success')
  })

  it('calls clienteApiRepository.getAll exactly once per mount', async () => {
    // GIVEN: Repository resolves
    mockGetAll.mockResolvedValue([])

    // WHEN: The hook is rendered once
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: getAll was called exactly once (no duplicate requests)
    expect(mockGetAll).toHaveBeenCalledTimes(1)
  })
})

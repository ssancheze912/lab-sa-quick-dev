// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.2: Client Detail View
// Test Level: Unit (Vitest + @testing-library/react renderHook)
// Phase: RED — fails until useCliente.ts and clienteApiRepository.getById exist
//
// Acceptance Criteria covered:
//   AC2 — useCliente fetches GET /api/v1/clientes/:id and returns client data
//   AC3 — isError=true with 404 error when client is not found
//   AC4 — isError=true when the repository rejects (network failure)
//
// Also validates:
//   - Canonical TanStack Query key: ['clientes', id]
//   - Hook is disabled when id is null/undefined
//   - refetch is exposed in the return value
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createCliente } from '../../../../test-support/factories/cliente.factory'

// ── Mock repository ───────────────────────────────────────────────────────────
// useCliente imports clienteApiRepository.getById; we mock at module level.
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

describe('useCliente — TanStack Query hook for single client (Story 2.2)', () => {
  it('returns client data when repository resolves with a valid clienteId', async () => {
    // GIVEN: The repository returns a specific client for the given id
    const cliente = createCliente({ nombre: 'Construcciones del Valle' })
    mockGetById.mockResolvedValue(cliente)

    // WHEN: The hook is rendered with a valid id
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })

    // THEN: data equals the resolved client
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(cliente)
    expect(result.current.isError).toBe(false)
  })

  it('sets isError=true when the repository rejects with a network error', async () => {
    // GIVEN: The repository throws a network error (backend unavailable)
    mockGetById.mockRejectedValue(new Error('Network Error'))

    // WHEN: The hook is rendered with a clienteId
    const { result } = renderHook(() => useCliente('some-id'), {
      wrapper: makeWrapper(),
    })

    // THEN: isError becomes true; data remains undefined
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('sets isError=true when the repository rejects with a 404 error', async () => {
    // GIVEN: The repository throws a 404 error (client not found)
    const notFoundError = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })
    mockGetById.mockRejectedValue(notFoundError)

    // WHEN: The hook is rendered with a non-existent clienteId
    const { result } = renderHook(() => useCliente('non-existent-id'), {
      wrapper: makeWrapper(),
    })

    // THEN: isError is true and the error has 404 status
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as { response?: { status: number } })?.response?.status).toBe(404)
  })

  it('exposes a refetch function in its return value', async () => {
    // GIVEN: The repository resolves
    const cliente = createCliente()
    mockGetById.mockResolvedValue(cliente)

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function')
  })

  it('is DISABLED (does not call getById) when id is null', async () => {
    // GIVEN: No clienteId provided (placeholder state — no client selected)
    // WHEN: The hook is rendered with null
    const { result } = renderHook(() => useCliente(null), {
      wrapper: makeWrapper(),
    })

    // THEN: getById is never called (query is disabled via enabled: !!id)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetById).not.toHaveBeenCalled()
  })

  it('is DISABLED (does not call getById) when id is undefined', async () => {
    // GIVEN: No clienteId provided
    // WHEN: The hook is rendered with undefined
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: makeWrapper(),
    })

    // THEN: getById is never called
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetById).not.toHaveBeenCalled()
  })

  it('uses the canonical query key ["clientes", id] for a specific client', async () => {
    // GIVEN: A QueryClient and a valid clienteId
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const cliente = createCliente()
    mockGetById.mockResolvedValue(cliente)

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    // WHEN: The hook is rendered and data is loaded
    const { result } = renderHook(() => useCliente(cliente.id), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: The query state exists under the ['clientes', id] key
    const queryState = qc.getQueryState(['clientes', cliente.id])
    expect(queryState).not.toBeUndefined()
    expect(queryState?.status).toBe('success')
  })

  it('calls clienteApiRepository.getById exactly once per mount with the correct id', async () => {
    // GIVEN: Repository resolves with a client
    const cliente = createCliente()
    mockGetById.mockResolvedValue(cliente)

    // WHEN: The hook is rendered once
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: getById was called exactly once with the correct id
    expect(mockGetById).toHaveBeenCalledTimes(1)
    expect(mockGetById).toHaveBeenCalledWith(cliente.id)
  })
})

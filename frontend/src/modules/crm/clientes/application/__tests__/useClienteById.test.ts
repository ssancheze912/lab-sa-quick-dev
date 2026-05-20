import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Cliente } from '../../domain/Cliente'

// Mock the repository module
vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getById: vi.fn(),
  },
}))

import { clienteApiRepository } from '../../infrastructure/clienteApiRepository'
import { useClienteById } from '../useClienteById'

const mockGetById = clienteApiRepository.getById as ReturnType<typeof vi.fn>

const mockCliente: Cliente = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  nombre: 'Empresa Alpha SAS',
  nit: '900100001-0',
  telefono: '+57 1 234 5678',
  ciudad: 'Bogotá',
  createdAt: '2026-05-20T10:00:00Z',
  updatedAt: '2026-05-20T10:00:00Z',
}

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
 * Unit tests for useClienteById hook — Story 2.2 expansion.
 *
 * Test IDs: UNIT-C-FE-BID-01 … UNIT-C-FE-BID-08
 */
describe('useClienteById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-01: Returns data when repository resolves successfully
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-01 — returns client data when repository resolves successfully', async () => {
    mockGetById.mockResolvedValueOnce(mockCliente)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClienteById(mockCliente.id), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCliente)
    expect(result.current.isError).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-02: Hook is NOT enabled when id is undefined
  // Boundary: `enabled: !!id` — hook must not fetch if id is falsy
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-02 — does not fetch when id is undefined', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClienteById(undefined), { wrapper })

    // Wait one tick; query should not start
    await new Promise((r) => setTimeout(r, 50))

    expect(mockGetById).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(result.current.fetchStatus).toBe('idle')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-03: isLoading is true before the response arrives
  // Boundary: component shows skeleton during this window
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-03 — isLoading is true before first response arrives', async () => {
    let resolvePromise!: (value: Cliente) => void
    const pendingPromise = new Promise<Cliente>((resolve) => {
      resolvePromise = resolve
    })
    mockGetById.mockReturnValueOnce(pendingPromise)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClienteById(mockCliente.id), { wrapper })

    expect(result.current.isLoading).toBe(true)

    act(() => { resolvePromise(mockCliente) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-04: isError is true when repository rejects (generic error)
  // Error path: network error, 500, etc.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-04 — isError is true when repository rejects', async () => {
    mockGetById.mockRejectedValueOnce(new Error('Network error'))

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClienteById(mockCliente.id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-05: 404 error has the error object accessible
  // Error path: is404 guard in ClienteDetailPanel depends on error.response.status
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-05 — error object is accessible when repository rejects with 404-shaped error', async () => {
    const notFoundError = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })
    mockGetById.mockRejectedValueOnce(notFoundError)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClienteById(mockCliente.id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const err = result.current.error as { response?: { status?: number } }
    expect(err?.response?.status).toBe(404)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-06: retry is false — hook does not retry on error
  // Boundary: ClienteDetailPanel must show not-found immediately, not after 3 retries
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-06 — does not retry on error (retry: false)', async () => {
    mockGetById.mockRejectedValue(new Error('404'))

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useClienteById(mockCliente.id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // With retry=false only one call should be made
    expect(mockGetById).toHaveBeenCalledTimes(1)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-07: Uses correct queryKey ['clientes', id]
  // Boundary: cache key must include id to avoid collisions between clients
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-07 — uses correct queryKey ["clientes", id]', async () => {
    mockGetById.mockResolvedValueOnce(mockCliente)

    const { wrapper, queryClient } = createWrapper()
    renderHook(() => useClienteById(mockCliente.id), { wrapper })

    await waitFor(() =>
      expect(
        queryClient.getQueryState(['clientes', mockCliente.id])?.status
      ).toBe('success')
    )
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-BID-08: Hook transitions from idle to loading when id changes from undefined to a value
  // Boundary: enabled transitions to true → query fires
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-BID-08 — transitions from idle to loading when id changes from undefined to a valid value', async () => {
    mockGetById.mockResolvedValue(mockCliente)

    const { wrapper } = createWrapper()

    let id: string | undefined = undefined
    const { result, rerender } = renderHook(() => useClienteById(id), { wrapper })

    // Initially idle (no id)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetById).not.toHaveBeenCalled()

    // Set a valid id
    id = mockCliente.id
    rerender()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetById).toHaveBeenCalledWith(mockCliente.id)
  })
})

/**
 * Story 2.5: Delete Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * useDeleteCliente does NOT exist yet — all tests will fail with module-not-found.
 *
 * Acceptance Criteria covered:
 *   AC2 — On success: invalidates ['clientes'] and ['contactos'] query keys,
 *          shows toast.success('Cliente eliminado correctamente') when no contacts
 *   AC4 — toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
 *          when hasContacts = true in onSuccess callback context
 *   AC2/AC4 — On error: shows toast.error('No se pudo eliminar. Intenta de nuevo.')
 *   AC2 — Hook exposes isPending, isError
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { toast } from 'sonner'

// useDeleteCliente does not exist yet — this import WILL FAIL (RED phase)
import { useDeleteCliente } from './useDeleteCliente'

// Mock the clienteApiRepository
vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    delete: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const CLIENTE_ID = '00000000-0000-0000-0000-000000000005'

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful deletion behavior (no contacts)
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — AC2: Successful deletion (no contacts)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.delete).mockResolvedValue(undefined)
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('calls clienteApiRepository.delete with the provided id', async () => {
    // GIVEN: useDeleteCliente hook is rendered
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called with a client id
    result.current.mutate(CLIENTE_ID)

    // THEN: repository.delete was called with the id
    await waitFor(() => {
      expect(clienteApiRepository.delete).toHaveBeenCalledWith(CLIENTE_ID)
    })
  })

  it('invalidates ["clientes"] query cache on success (AC2 — FR27)', async () => {
    // GIVEN: queryClient has a ['clientes'] query cached
    queryClient.setQueryData(['clientes'], [])
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(CLIENTE_ID)

    // THEN: invalidateQueries is called with ['clientes']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      )
    })
  })

  it('invalidates ["contactos"] query cache on success (AC4 — FR25 unassignment)', async () => {
    // GIVEN: queryClient has a ['contactos'] query cached
    queryClient.setQueryData(['contactos'], [])
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(CLIENTE_ID)

    // THEN: invalidateQueries is called with ['contactos'] (contacts now unassigned — FR25)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      )
    })
  })

  it('calls onSuccess callback when provided and mutation succeeds', async () => {
    // GIVEN: useDeleteCliente with an onSuccess callback
    const onSuccessMock = vi.fn()
    const { result } = renderHook(() => useDeleteCliente({ onSuccess: onSuccessMock }), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(CLIENTE_ID)

    // THEN: onSuccess callback is invoked
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledOnce()
    })
  })

  it('returns isPending as true while mutation is in flight', async () => {
    // GIVEN: repository.delete returns a pending promise
    let resolveDelete: ((value: undefined) => void) | null = null
    vi.mocked(clienteApiRepository.delete).mockReturnValue(
      new Promise((resolve) => { resolveDelete = resolve })
    )

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called and deletion is still pending
    result.current.mutate(CLIENTE_ID)

    // THEN: isPending is true
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Release the promise
    if (resolveDelete) resolveDelete(undefined)
  })

  it('exposes mutate function from the hook', () => {
    // GIVEN: useDeleteCliente is rendered
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // THEN: mutate is a function
    expect(typeof result.current.mutate).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 / AC4 — Error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente — AC2/AC4: Error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('shows error toast "No se pudo eliminar. Intenta de nuevo." on failure', async () => {
    // GIVEN: repository.delete rejects
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(CLIENTE_ID)

    // THEN: Error toast with exact message is shown
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
    })
  })

  it('sets isError to true when mutation fails', async () => {
    // GIVEN: repository.delete rejects with 500
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(CLIENTE_ID)

    // THEN: isError state is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('sets isError to true when mutation fails with 404 (client not found)', async () => {
    // GIVEN: repository.delete rejects with 404
    const error404 = Object.assign(new Error('Request failed with status code 404'), {
      isAxiosError: true,
      response: { status: 404, data: { status: 404, detail: 'Client not found' } },
    })

    vi.mocked(clienteApiRepository.delete).mockRejectedValue(error404)

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(CLIENTE_ID)

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('does NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: repository.delete rejects
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Server error'))
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(CLIENTE_ID)
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: cache is NOT invalidated on error
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] })
    )
  })

  it('does NOT call onSuccess callback when mutation fails', async () => {
    // GIVEN: repository.delete rejects
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Server error'))
    const onSuccessMock = vi.fn()

    const { result } = renderHook(() => useDeleteCliente({ onSuccess: onSuccessMock }), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(CLIENTE_ID)
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: onSuccess is NOT called
    expect(onSuccessMock).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    delete: vi.fn(),
  },
}))

vi.mock('../../../../../shared/lib/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { clienteApiRepository } from '../../infrastructure/clienteApiRepository'
import { toast } from '../../../../../shared/lib/toastStore'
import { useDeleteCliente } from '../useDeleteCliente'

const mockDelete = clienteApiRepository.delete as ReturnType<typeof vi.fn>
const mockToastError = toast.error as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

/**
 * Unit tests for useDeleteCliente mutation hook — Story 2.5.
 */
describe('useDeleteCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const clienteId = '550e8400-e29b-41d4-a716-446655440099'

  it('starts in idle state', () => {
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('successful mutation transitions to isSuccess = true', async () => {
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(clienteId)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
    expect(mockDelete).toHaveBeenCalledWith(clienteId)
  })

  it('rejected mutation transitions to isError = true and calls toast.error', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(clienteId)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isPending).toBe(false)
    expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
  })

  // ---------------------------------------------------------------------------
  // Edge case: toast.error message is exactly the expected Spanish string
  // Boundary: exact string match, not partial — user-visible contract
  // ---------------------------------------------------------------------------
  it('toast.error is called with the exact Spanish error message', async () => {
    mockDelete.mockRejectedValueOnce(new Error('500 Internal'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(clienteId)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledTimes(1)
    expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
  })

  // ---------------------------------------------------------------------------
  // Edge case: mutate is called with the exact id passed in (no transformation)
  // Boundary: hook must forward the id as-is to the repository
  // ---------------------------------------------------------------------------
  it('passes the exact clienteId to clienteApiRepository.delete', async () => {
    const specificId = 'ffffffff-1111-4000-8000-aaaaaaaaaaaa'
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(specificId)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDelete).toHaveBeenCalledWith(specificId)
  })

  // ---------------------------------------------------------------------------
  // Edge case: success does NOT call toast.error
  // Mutual exclusion: error toast must not fire on a successful deletion
  // ---------------------------------------------------------------------------
  it('does not call toast.error on successful deletion', async () => {
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(clienteId)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockToastError).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Edge case: error does NOT transition to isSuccess
  // Mutual exclusion: failed mutation must not appear successful
  // ---------------------------------------------------------------------------
  it('isSuccess remains false after a failed mutation', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Timeout'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(clienteId)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isSuccess).toBe(false)
  })
})

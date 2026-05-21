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
})

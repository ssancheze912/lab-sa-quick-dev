import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the repository and toastStore before importing the hook
vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    create: vi.fn(),
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
import { useCreateCliente } from '../useCreateCliente'

const mockCreate = clienteApiRepository.create as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>

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
 * Unit tests for useCreateCliente mutation hook — Story 2.3 edge case expansion.
 * BMad-Integrated: covers mutation success, error paths, and side-effects.
 *
 * Test IDs: UNIT-C-FE-HOOK-01 … UNIT-C-FE-HOOK-05
 */
describe('useCreateCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validPayload = {
    nombre: 'Empresa Test SAS',
    nit: '900100001-0',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  }

  const mockCliente = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Empresa Test SAS',
    nit: '900100001-0',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-05-21T10:00:00Z',
    updatedAt: '2026-05-21T10:00:00Z',
  }

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-HOOK-01: mutation starts in idle state
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-HOOK-01 — mutation starts in idle state (not pending, not success, not error)', () => {
    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(),
    })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-HOOK-02: successful mutation calls toast.success with correct message
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-HOOK-02 — successful mutation calls toast.success("Cliente creado correctamente")', async () => {
    mockCreate.mockResolvedValueOnce(mockCliente)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledOnce()
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente creado correctamente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-HOOK-03: successful mutation transitions to isSuccess = true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-HOOK-03 — successful mutation transitions to isSuccess = true', async () => {
    mockCreate.mockResolvedValueOnce(mockCliente)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-HOOK-04: rejected mutation transitions to isError = true
  // Error path: network failure or unexpected server error
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-HOOK-04 — rejected mutation transitions to isError = true', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-HOOK-05: rejected mutation does NOT call toast.success
  // Error path: toast must NOT fire on failure
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-HOOK-05 — rejected mutation does not call toast.success', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

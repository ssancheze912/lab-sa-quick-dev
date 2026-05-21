import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the repository and toastStore before importing the hook
vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    update: vi.fn(),
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
import { useUpdateCliente } from '../useUpdateCliente'

const mockUpdate = clienteApiRepository.update as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>
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
 * Unit tests for useUpdateCliente mutation hook — Story 2.4.
 *
 * Test IDs: UNIT-C-FE-UPD-01 … UNIT-C-FE-UPD-05
 */
describe('useUpdateCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validPayload = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    data: {
      nombre: 'Empresa Actualizada SAS',
      nit: '900100001-0',
      telefono: '3009999999',
      ciudad: 'Medellín',
    },
  }

  const mockCliente = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Empresa Actualizada SAS',
    nit: '900100001-0',
    telefono: '3009999999',
    ciudad: 'Medellín',
    createdAt: '2026-05-21T10:00:00Z',
    updatedAt: '2026-05-21T11:00:00Z',
  }

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UPD-01: mutation starts in idle state
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UPD-01 — mutation starts in idle state', () => {
    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(),
    })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UPD-02: successful mutation calls toast.success with correct message
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UPD-02 — successful mutation calls toast.success("Cliente actualizado correctamente")', async () => {
    mockUpdate.mockResolvedValueOnce(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledOnce()
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UPD-03: successful mutation transitions to isSuccess = true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UPD-03 — successful mutation transitions to isSuccess = true', async () => {
    mockUpdate.mockResolvedValueOnce(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-UPD-04: rejected mutation transitions to isError = true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UPD-04 — rejected mutation transitions to isError = true', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useUpdateCliente(), {
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
  // UNIT-C-FE-UPD-05: rejected mutation calls toast.error and not toast.success
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-UPD-05 — rejected mutation calls toast.error and not toast.success', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(validPayload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
  })
})

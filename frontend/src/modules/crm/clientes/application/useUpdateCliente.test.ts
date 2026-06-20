// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.4: Edit Client — useUpdateCliente Unit Tests
// Test Level: Unit (Vitest + @testing-library/react renderHook)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC2 — On success: invalidates ['clientes'] and ['clientes', id],
//          shows toast "Cliente actualizado correctamente"
//   AC5 — On 409 error, does NOT show generic error toast
//   AC6 — isPending is true while mutation is in-flight
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

// ── Mock toast ────────────────────────────────────────────────────────────────
vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import { toast } from 'siesa-ui-kit'
import { useUpdateCliente } from './useUpdateCliente'

const mockUpdate = clienteApiRepository.update as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>
const mockToastError = toast.error as ReturnType<typeof vi.fn>

// ── Test data ─────────────────────────────────────────────────────────────────

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const validData = {
  nombre: 'Empresa Actualizada',
  nit: '900111222-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

const mockCliente = {
  id: CLIENTE_ID,
  ...validData,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ── Wrapper factory ───────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    qc,
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: qc }, children)
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────

describe('useUpdateCliente', () => {
  it('returns a mutate function and isPending=false initially', () => {
    // GIVEN: Hook is rendered with a client ID
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // THEN: mutate exists and isPending is false
    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })

  // ── AC2 — Success path ────────────────────────────────────────────────────

  it('AC2 — calls toast.success with "Cliente actualizado correctamente" on success', async () => {
    // GIVEN: Repository resolves with updated cliente
    const { wrapper } = makeWrapper()
    mockUpdate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Success toast fires with the correct Spanish message
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Cliente actualizado correctamente')
    })
  })

  it('AC2 — calls invalidateQueries with queryKey ["clientes"] on success', async () => {
    // GIVEN: Repository resolves successfully
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    mockUpdate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: invalidateQueries fires for ['clientes'] (list)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] }),
      )
    })
  })

  it('AC2 — calls invalidateQueries with queryKey ["clientes", id] on success (FR27)', async () => {
    // GIVEN: Repository resolves successfully
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    mockUpdate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: invalidateQueries also fires for ['clientes', id] (detail)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes', CLIENTE_ID] }),
      )
    })
  })

  // ── AC5 — 409 conflict path ───────────────────────────────────────────────

  it('AC5 — does NOT call toast.error on 409 conflict (handled by form setError)', async () => {
    // GIVEN: Repository returns 409 conflict
    const { wrapper } = makeWrapper()
    const conflictError = Object.assign(new Error('Conflict'), {
      response: { status: 409, data: { detail: 'NIT ya registrado' } },
    })
    mockUpdate.mockRejectedValue(conflictError)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // THEN: toast.error is NOT called for 409 (form handles it via setError)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('AC5 — isError is true and error contains 409 status after conflict', async () => {
    // GIVEN: Repository returns 409 conflict error
    const { wrapper } = makeWrapper()
    const conflictError = Object.assign(new Error('Conflict'), {
      response: { status: 409 },
    })
    mockUpdate.mockRejectedValue(conflictError)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Hook exposes isError=true and the error with status 409
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    const axiosErr = result.current.error as { response?: { status: number } }
    expect(axiosErr?.response?.status).toBe(409)
  })

  it('calls toast.error on non-409 errors (e.g., 500)', async () => {
    // GIVEN: Repository returns a generic server error
    const { wrapper } = makeWrapper()
    const serverError = Object.assign(new Error('Server Error'), {
      response: { status: 500 },
    })
    mockUpdate.mockRejectedValue(serverError)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Generic error toast fires
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  it('calls toast.error when network error occurs (no response object)', async () => {
    // GIVEN: Network error with no response (offline / DNS failure)
    const { wrapper } = makeWrapper()
    const networkError = new Error('Network Error')
    mockUpdate.mockRejectedValue(networkError)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Generic toast.error fires (status is undefined, not 409)
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  // ── AC6 — Loading state ───────────────────────────────────────────────────

  it('AC6 — isPending is true while mutation is in-flight', async () => {
    // GIVEN: Repository promise never resolves (simulates slow backend)
    const { wrapper } = makeWrapper()
    let resolveUpdate: (v: unknown) => void = () => {}
    const pendingPromise = new Promise((r) => {
      resolveUpdate = r
    })
    mockUpdate.mockReturnValue(pendingPromise)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is triggered
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: isPending is true while request is in-flight
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Cleanup: resolve the promise to avoid memory leaks
    act(() => {
      resolveUpdate(mockCliente)
    })
  })

  it('isSuccess becomes true after a successful mutation', async () => {
    // GIVEN: Repository resolves successfully
    const { wrapper } = makeWrapper()
    mockUpdate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: isSuccess transitions to true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('mutate passes all 4 fields and the client ID to the repository update function', async () => {
    // GIVEN: Repository resolves successfully
    const { wrapper } = makeWrapper()
    mockUpdate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper })

    const input = {
      nombre: 'Inversiones Valle',
      nit: '811234567-9',
      telefono: '6024567890',
      ciudad: 'Cali',
    }

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(input)
    })

    // THEN: Repository receives the correct ID and data
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(CLIENTE_ID, input)
    })
  })
})

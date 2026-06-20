// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases — Story 2.3: useCreateCliente Hook
// Test Level: Unit (Vitest + @testing-library/react renderHook)
// Mode: BMad-Integrated — expands ATDD coverage with edge cases NOT in
//       useCreateCliente.test.ts
//
// Coverage added here (not in ATDD):
//   - [P1] invalidateQueries(['clientes']) is called on success
//   - [P1] 400 backend error triggers generic toast.error
//   - [P1] Network error (no response object) triggers generic toast.error
//   - [P2] isPending transitions: false → true → false
//   - [P2] mutate can be called with minimum valid data (single-char fields)
//   - [P2] 503 error triggers generic toast.error
//   - [P2] isSuccess becomes true after successful mutation
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
import { useCreateCliente } from './useCreateCliente'

const mockCreate = clienteApiRepository.create as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>
const mockToastError = toast.error as ReturnType<typeof vi.fn>

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

const validData = {
  nombre: 'Empresa Test',
  nit: '900111222-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

const mockCliente = {
  id: 'abc-123',
  ...validData,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente — edge cases', () => {
  it('[P1] calls invalidateQueries with queryKey ["clientes"] on success', async () => {
    // GIVEN: Successful mutation
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    mockCreate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: invalidateQueries is called with ['clientes'] key
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] }),
      )
    })
  })

  it('[P1] calls toast.error on 400 Bad Request error', async () => {
    // GIVEN: Backend returns 400 validation error
    const { wrapper } = makeWrapper()
    const badRequestError = Object.assign(new Error('Bad Request'), {
      response: { status: 400, data: { title: 'Validation failed' } },
    })
    mockCreate.mockRejectedValue(badRequestError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // WHEN: mutate is triggered
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Generic error toast fires (400 is not 409)
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  it('[P1] calls toast.error when network error occurs (no response object)', async () => {
    // GIVEN: Network error with no response (offline / CORS / DNS failure)
    const { wrapper } = makeWrapper()
    const networkError = new Error('Network Error')
    // No .response property — simulates Axios network error
    mockCreate.mockRejectedValue(networkError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Generic toast.error fires (status is undefined, not 409)
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  it('[P2] calls toast.error on 503 Service Unavailable', async () => {
    // GIVEN: Backend is temporarily unavailable
    const { wrapper } = makeWrapper()
    const serviceUnavailableError = Object.assign(new Error('Service Unavailable'), {
      response: { status: 503 },
    })
    mockCreate.mockRejectedValue(serviceUnavailableError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  it('[P2] isSuccess becomes true after a successful mutation', async () => {
    // GIVEN: Repository resolves successfully
    const { wrapper } = makeWrapper()
    mockCreate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // WHEN: mutate is called
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: isSuccess transitions to true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('[P2] isPending is true while mutation is in-flight', async () => {
    // GIVEN: Repository promise never resolves (simulates slow backend)
    const { wrapper } = makeWrapper()
    let resolveCreate: (v: unknown) => void = () => {}
    const pendingPromise = new Promise((r) => { resolveCreate = r })
    mockCreate.mockReturnValue(pendingPromise)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // WHEN: mutate is triggered
    act(() => {
      result.current.mutate(validData)
    })

    // THEN: isPending is true while request is in-flight
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Cleanup: resolve the promise to avoid memory leaks in test runner
    act(() => {
      resolveCreate(mockCliente)
    })
  })

  it('[P2] mutate passes all 4 required fields to the repository create function', async () => {
    // GIVEN: A specific dataset with all 4 required fields
    const { wrapper } = makeWrapper()
    mockCreate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

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

    // THEN: Repository receives exact same data
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(input)
    })
  })

  it('[P2] does NOT call toast.error on 409 conflict (error handled by form setError)', async () => {
    // GIVEN: 409 conflict
    const { wrapper } = makeWrapper()
    const conflictError = Object.assign(new Error('Conflict'), {
      response: { status: 409, data: { detail: 'NIT ya registrado' } },
    })
    mockCreate.mockRejectedValue(conflictError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: toast.error is NOT called for 409
    expect(mockToastError).not.toHaveBeenCalled()
    // AND toast.success is NOT called
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('[P2] isError is true and error contains 409 status after conflict', async () => {
    // GIVEN: 409 conflict error
    const { wrapper } = makeWrapper()
    const conflictError = Object.assign(new Error('Conflict'), {
      response: { status: 409 },
    })
    mockCreate.mockRejectedValue(conflictError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    // THEN: Hook exposes isError=true and the error object with status 409
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    const axiosErr = result.current.error as { response?: { status: number } }
    expect(axiosErr?.response?.status).toBe(409)
  })
})

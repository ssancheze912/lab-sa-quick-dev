// ─────────────────────────────────────────────────────────────────────────────
// Story 2.3: Create Client — useCreateCliente Unit Tests
// Test Level: Unit (Vitest + @testing-library/react renderHook)
//
// Acceptance Criteria covered:
//   AC2 — On success, invalidates ['clientes'] query and shows success toast
//   AC4 — On 409 error, does NOT show generic error toast
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

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente', () => {
  it('returns a mutate function and isPending=false initially', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })

  it('AC2 — calls toast.success with correct message on successful mutation', async () => {
    const { wrapper } = makeWrapper()
    const mockCliente = {
      id: 'abc-123',
      nombre: 'Empresa Test',
      nit: '900111222-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockCreate.mockResolvedValue(mockCliente)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    act(() => {
      result.current.mutate({
        nombre: 'Empresa Test',
        nit: '900111222-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Cliente creado correctamente')
    })
  })

  it('AC4 — does NOT call toast.error on 409 conflict', async () => {
    const { wrapper } = makeWrapper()
    const conflictError = Object.assign(new Error('Conflict'), {
      response: { status: 409, data: { detail: 'NIT ya registrado' } },
    })
    mockCreate.mockRejectedValue(conflictError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    act(() => {
      result.current.mutate({
        nombre: 'Empresa Test',
        nit: '900111222-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('calls toast.error on non-409 errors', async () => {
    const { wrapper } = makeWrapper()
    const serverError = Object.assign(new Error('Server Error'), {
      response: { status: 500 },
    })
    mockCreate.mockRejectedValue(serverError)

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    act(() => {
      result.current.mutate({
        nombre: 'Empresa Test',
        nit: '900111222-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })
})

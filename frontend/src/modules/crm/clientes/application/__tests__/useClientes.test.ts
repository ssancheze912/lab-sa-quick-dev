import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Cliente } from '../../domain/Cliente'

// Mock the repository module
vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
  },
}))

import { clienteApiRepository } from '../../infrastructure/clienteApiRepository'
import { useClientes } from '../useClientes'

const mockGetAll = clienteApiRepository.getAll as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useClientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // UNIT-C-FE-01: useClientes returns data from clienteApiRepository.getAll() on success
  it('UNIT-C-FE-01 — returns client data from repository on success', async () => {
    const mockClientes: Cliente[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        nombre: 'Empresa Alpha SAS',
        nit: '900100001-0',
        telefono: '+57 1 234 5678',
        ciudad: 'Bogotá',
        createdAt: '2026-05-20T10:00:00Z',
        updatedAt: '2026-05-20T10:00:00Z',
      },
    ]
    mockGetAll.mockResolvedValueOnce(mockClientes)

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockClientes)
    expect(result.current.isError).toBe(false)
  })

  // UNIT-C-FE-02: useClientes exposes isError = true when repository throws
  it('UNIT-C-FE-02 — exposes isError = true when fetch throws', async () => {
    mockGetAll.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toBeUndefined()
  })
})

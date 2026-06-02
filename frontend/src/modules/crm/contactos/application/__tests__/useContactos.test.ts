import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Contacto } from '../../domain/Contacto'

// Mock the repository module
vi.mock('../../infrastructure/contactoApiRepository', () => ({
  contactoApiRepository: {
    getAll: vi.fn(),
  },
}))

import { contactoApiRepository } from '../../infrastructure/contactoApiRepository'
import { useContactos } from '../useContactos'

const mockGetAll = contactoApiRepository.getAll as ReturnType<typeof vi.fn>

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

describe('useContactos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // UNIT-CT-FE-01: useContactos returns data from contactoApiRepository.getAll() on success
  it('UNIT-CT-FE-01 — returns contact data from repository on success', async () => {
    const mockContactos: Contacto[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        nombre: 'María García',
        cargo: 'Gerente Comercial',
        telefono: '+57 1 234 5679',
        email: 'm.garcia@empresa.com',
        clienteId: null,
        createdAt: '2026-05-21T10:30:00Z',
        updatedAt: '2026-05-21T10:30:00Z',
      },
    ]
    mockGetAll.mockResolvedValueOnce(mockContactos)

    const { result } = renderHook(() => useContactos(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockContactos)
    expect(result.current.isError).toBe(false)
  })

  // UNIT-CT-FE-02: useContactos exposes isError = true when repository throws
  it('UNIT-CT-FE-02 — exposes isError = true when fetch throws', async () => {
    mockGetAll.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useContactos(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toBeUndefined()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Contacto } from '../../domain/Contacto'

/**
 * ATDD — Story 3.1: Contact List & Search
 * Unit tests for useContactos TanStack Query hook.
 *
 * Tests are in RED phase — they define expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing:
 *   frontend/src/modules/crm/contactos/application/useContactos.ts
 *   frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
 *   frontend/src/modules/crm/contactos/domain/Contacto.ts
 *
 * Coverage:
 *   UNIT-CT-FE-01 (P1) — useContactos returns contact data from repository on success
 *   UNIT-CT-FE-02 (P1) — useContactos exposes isError = true when fetch throws
 */

// Mock the repository module before importing the hook
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

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-01 (P1 · AC1)
  // Given the contactoApiRepository.getAll() resolves successfully
  // When useContactos hook is rendered
  // Then it returns the contact data and isError is false
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-01 — returns contact data from repository on success', async () => {
    // GIVEN — repository returns a list of contacts
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
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        nombre: 'Carlos López',
        cargo: 'Analista TI',
        telefono: '+57 1 234 5680',
        email: 'c.lopez@empresa.com',
        clienteId: null,
        createdAt: '2026-05-21T10:31:00Z',
        updatedAt: '2026-05-21T10:31:00Z',
      },
    ]
    mockGetAll.mockResolvedValueOnce(mockContactos)

    // WHEN — hook is rendered
    const { result } = renderHook(() => useContactos(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN — data matches repository response and isError is false
    expect(result.current.data).toEqual(mockContactos)
    expect(result.current.isError).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-FE-02 (P1 · AC4)
  // Given the contactoApiRepository.getAll() rejects with an error
  // When useContactos hook is rendered
  // Then it exposes isError = true and data is undefined
  // ---------------------------------------------------------------------------
  it('UNIT-CT-FE-02 — exposes isError = true when fetch throws', async () => {
    // GIVEN — repository throws a network error
    mockGetAll.mockRejectedValueOnce(new Error('Network error'))

    // WHEN — hook is rendered
    const { result } = renderHook(() => useContactos(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN — data is undefined and isError is true
    expect(result.current.data).toBeUndefined()
    expect(result.current.isError).toBe(true)
  })
})

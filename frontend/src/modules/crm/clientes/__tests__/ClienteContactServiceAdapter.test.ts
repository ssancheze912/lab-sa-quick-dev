import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

/**
 * ATDD — Story 4.1 & Story 4.2
 * Unit Tests — ClienteContactServiceAdapter
 *
 * Coverage:
 *   UNIT-AC-01  P1  — getContactos() calls GET /api/v1/contactos?clienteId={id}
 *   UNIT-AC-02  P1  — assignContacto(contactoId) calls PUT /api/v1/contactos/{id}/cliente with { clienteId }
 *   UNIT-AC-03  P1  — removeContacto(contactoId) calls PUT /api/v1/contactos/{id}/cliente with { clienteId: null }
 */

// Mock the apiClient before importing the module under test
vi.mock('../../../../shared/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

// Mock toastStore to avoid side effects in unit tests
vi.mock('../../../../shared/lib/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { apiClient } from '../../../../shared/lib/apiClient'
import { ClienteContactServiceAdapter } from '../presentation/ClienteContactServiceAdapter'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPut = apiClient.put as ReturnType<typeof vi.fn>

function makeMockQueryClient(): QueryClient {
  return {
    invalidateQueries: vi.fn(),
  } as unknown as QueryClient
}

describe('ClienteContactServiceAdapter', () => {
  const CLIENT_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-01 (P1 · AC1)
  // Given a ClienteContactServiceAdapter instantiated with a clienteId
  // When getContactos() is called
  // Then apiClient.get is called with the URL
  //   GET /api/v1/contactos?clienteId={clienteId}
  // AND the returned data array is returned as-is
  // ---------------------------------------------------------------------------
  it('UNIT-AC-01 — getContactos() calls GET /api/v1/contactos?clienteId={id} with the correct URL', async () => {
    // GIVEN — Prepare mock response
    const mockContactos = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        nombre: 'María García',
        cargo: 'Gerente Comercial',
        telefono: '+57 1 234 5679',
        email: 'm.garcia@empresa.com',
        clienteId: CLIENT_ID,
        createdAt: '2026-05-21T10:30:00Z',
        updatedAt: '2026-05-21T10:30:00Z',
      },
    ]
    mockGet.mockResolvedValueOnce({ data: mockContactos })

    // GIVEN — Instantiate adapter with a specific clienteId and mock queryClient
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN — getContactos() is called
    const result = await adapter.getContactos()

    // THEN — apiClient.get was called exactly once with the correct URL
    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith(
      `/api/v1/contactos?clienteId=${CLIENT_ID}`
    )

    // AND — the returned data matches the mocked response
    expect(result).toEqual(mockContactos)
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-01b (P1 · AC1 — isolation guard)
  // Given two adapters with different clienteIds
  // When each calls getContactos()
  // Then each uses its own clienteId in the URL — no cross-contamination
  // ---------------------------------------------------------------------------
  it('UNIT-AC-01b — each adapter instance uses its own clienteId in the URL', async () => {
    const clienteId1 = '11111111-1111-4111-8111-111111111111'
    const clienteId2 = '22222222-2222-4222-8222-222222222222'

    mockGet
      .mockResolvedValueOnce({ data: [{ id: 'c1', clienteId: clienteId1 }] })
      .mockResolvedValueOnce({ data: [{ id: 'c2', clienteId: clienteId2 }] })

    // GIVEN — Two adapter instances with different clienteIds
    const adapter1 = new ClienteContactServiceAdapter(clienteId1, makeMockQueryClient())
    const adapter2 = new ClienteContactServiceAdapter(clienteId2, makeMockQueryClient())

    // WHEN — Each adapter calls getContactos()
    await adapter1.getContactos()
    await adapter2.getContactos()

    // THEN — Each used its own clienteId in the URL
    expect(mockGet).toHaveBeenNthCalledWith(
      1,
      `/api/v1/contactos?clienteId=${clienteId1}`
    )
    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      `/api/v1/contactos?clienteId=${clienteId2}`
    )
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-01c (P1 · AC3 — error propagation)
  // Given the apiClient.get rejects with a network error
  // When getContactos() is called
  // Then the error propagates to the caller (no swallowing)
  // ---------------------------------------------------------------------------
  it('UNIT-AC-01c — getContactos() propagates errors from apiClient to the caller', async () => {
    // GIVEN — apiClient.get rejects
    const networkError = new Error('Network Error')
    mockGet.mockRejectedValueOnce(networkError)

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN / THEN — error is not swallowed
    await expect(adapter.getContactos()).rejects.toThrow('Network Error')
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-02 (P1 · AC1)
  // Given a ClienteContactServiceAdapter instantiated with a clienteId
  // When assignContacto(contactoId) is called
  // Then apiClient.put is called with
  //   PUT /api/v1/contactos/{contactoId}/cliente with body { clienteId: this.clienteId }
  // AND queryClient.invalidateQueries is called with ['contactos'] and ['contactos', { clienteId }]
  // ---------------------------------------------------------------------------
  it('UNIT-AC-02 — assignContacto(contactoId) calls PUT /api/v1/contactos/{id}/cliente with { clienteId }', async () => {
    // GIVEN
    const contactoId = '550e8400-e29b-41d4-a716-446655440002'
    mockPut.mockResolvedValueOnce({ data: { id: contactoId, clienteId: CLIENT_ID } })
    const queryClient = makeMockQueryClient()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, queryClient)

    // WHEN
    await adapter.assignContacto(contactoId)

    // THEN — PUT called with correct URL and body
    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(mockPut).toHaveBeenCalledWith(
      `/api/v1/contactos/${contactoId}/cliente`,
      { clienteId: CLIENT_ID }
    )

    // AND — Both query keys invalidated
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contactos'] })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contactos', { clienteId: CLIENT_ID }] })
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-03 (P1 · AC3)
  // Given a ClienteContactServiceAdapter instantiated with a clienteId
  // When removeContacto(contactoId) is called
  // Then apiClient.put is called with
  //   PUT /api/v1/contactos/{contactoId}/cliente with body { clienteId: null }
  // AND queryClient.invalidateQueries is called with ['contactos'] and ['contactos', { clienteId }]
  // AND the contact is NOT deleted (only clienteId set to null)
  // ---------------------------------------------------------------------------
  it('UNIT-AC-03 — removeContacto(contactoId) calls PUT /api/v1/contactos/{id}/cliente with { clienteId: null }', async () => {
    // GIVEN
    const contactoId = '550e8400-e29b-41d4-a716-446655440003'
    mockPut.mockResolvedValueOnce({ data: { id: contactoId, clienteId: null } })
    const queryClient = makeMockQueryClient()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, queryClient)

    // WHEN
    await adapter.removeContacto(contactoId)

    // THEN — PUT called with correct URL and null clienteId body
    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(mockPut).toHaveBeenCalledWith(
      `/api/v1/contactos/${contactoId}/cliente`,
      { clienteId: null }
    )

    // AND — Both query keys invalidated (dual invalidation — R1)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contactos'] })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contactos', { clienteId: CLIENT_ID }] })
  })
})

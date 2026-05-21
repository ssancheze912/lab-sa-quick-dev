import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * ATDD — Story 4.1: View Associated Contacts in Client Detail
 * Unit Tests — ClienteContactServiceAdapter
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 *
 * Coverage:
 *   UNIT-AC-01  P1  — ClienteContactServiceAdapter.getContactos() calls
 *                     GET /api/v1/contactos?clienteId={id} with the correct URL
 */

// Mock the apiClient before importing the module under test
vi.mock('../../../../shared/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../../../../shared/lib/apiClient'
// Import will fail until the file is created — RED phase expected
import { ClienteContactServiceAdapter } from '../presentation/ClienteContactServiceAdapter'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

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

    // GIVEN — Instantiate adapter with a specific clienteId
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

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
    const adapter1 = new ClienteContactServiceAdapter(clienteId1)
    const adapter2 = new ClienteContactServiceAdapter(clienteId2)

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
  // AND it lets the ContactManager handle the error state (delegated)
  // ---------------------------------------------------------------------------
  it('UNIT-AC-01c — getContactos() propagates errors from apiClient to the caller', async () => {
    // GIVEN — apiClient.get rejects
    const networkError = new Error('Network Error')
    mockGet.mockRejectedValueOnce(networkError)

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID)

    // WHEN / THEN — error is not swallowed
    await expect(adapter.getContactos()).rejects.toThrow('Network Error')
  })
})

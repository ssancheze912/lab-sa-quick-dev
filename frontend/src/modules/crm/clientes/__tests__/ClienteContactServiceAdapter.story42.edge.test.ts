import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Edge Case Tests — Story 4.2: ClienteContactServiceAdapter write operations
 *
 * Expands ATDD baseline (ClienteContactServiceAdapter.test.ts — UNIT-AC-02, UNIT-AC-03) with:
 *   - UNIT-42-EDGE-01 [P1] assignContacto() propagates PUT error to caller (no silent swallow)
 *   - UNIT-42-EDGE-02 [P1] removeContacto() propagates PUT error to caller (no silent swallow)
 *   - UNIT-42-EDGE-03 [P1] assignContacto() does NOT call invalidateQueries when PUT fails
 *   - UNIT-42-EDGE-04 [P1] removeContacto() does NOT call invalidateQueries when PUT fails
 *   - UNIT-42-EDGE-05 [P1] assignContacto() calls toast.success("Contacto asociado correctamente") on success
 *   - UNIT-42-EDGE-06 [P1] removeContacto() calls toast.success("Contacto desasociado correctamente") on success
 *   - UNIT-42-EDGE-07 [P2] assignContacto() does NOT call toast.success when PUT throws
 *   - UNIT-42-EDGE-08 [P2] Two consecutive assignContacto() calls each invalidate both query keys
 *   - UNIT-42-EDGE-09 [P2] removeContacto() sends { clienteId: null } — NOT { clienteId: undefined }
 *   - UNIT-42-EDGE-10 [P2] assignContacto() with different contactoIds generates distinct PUT URLs
 */

vi.mock('../../../../shared/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('../../../../shared/lib/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { apiClient } from '../../../../shared/lib/apiClient'
import { toast } from '../../../../shared/lib/toastStore'
import { ClienteContactServiceAdapter } from '../presentation/ClienteContactServiceAdapter'

const mockPut = apiClient.put as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>

const CLIENT_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const CONTACTO_ID = '550e8400-e29b-41d4-a716-446655440099'

function makeMockQueryClient(): QueryClient {
  return { invalidateQueries: vi.fn() } as unknown as QueryClient
}

describe('ClienteContactServiceAdapter — Story 4.2 Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-01 [P1]
  // Given apiClient.put rejects with a network error
  // When assignContacto(contactoId) is called
  // Then the error propagates to the caller (not swallowed by the adapter)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-42-EDGE-01 — assignContacto() propagates PUT error to caller', async () => {
    // GIVEN — PUT rejects
    const networkError = new Error('Network Error')
    mockPut.mockRejectedValueOnce(networkError)

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN / THEN — error propagates
    await expect(adapter.assignContacto(CONTACTO_ID)).rejects.toThrow('Network Error')
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-02 [P1]
  // Given apiClient.put rejects with a network error
  // When removeContacto(contactoId) is called
  // Then the error propagates to the caller (not swallowed)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-42-EDGE-02 — removeContacto() propagates PUT error to caller', async () => {
    // GIVEN — PUT rejects
    const networkError = new Error('Connection refused')
    mockPut.mockRejectedValueOnce(networkError)

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN / THEN — error propagates
    await expect(adapter.removeContacto(CONTACTO_ID)).rejects.toThrow('Connection refused')
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-03 [P1]
  // Given apiClient.put rejects when calling assignContacto
  // When the rejection occurs
  // Then queryClient.invalidateQueries is NEVER called (no partial cache invalidation on error)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-42-EDGE-03 — assignContacto() não chama invalidateQueries quando PUT falha', async () => {
    // GIVEN — PUT rejects
    mockPut.mockRejectedValueOnce(new Error('Fail'))
    const queryClient = makeMockQueryClient()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, queryClient)

    // WHEN — call and ignore the error
    await adapter.assignContacto(CONTACTO_ID).catch(() => null)

    // THEN — queryClient.invalidateQueries was NOT called
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-04 [P1]
  // Given apiClient.put rejects when calling removeContacto
  // When the rejection occurs
  // Then queryClient.invalidateQueries is NEVER called
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-42-EDGE-04 — removeContacto() não chama invalidateQueries quando PUT falha', async () => {
    // GIVEN — PUT rejects
    mockPut.mockRejectedValueOnce(new Error('Fail'))
    const queryClient = makeMockQueryClient()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, queryClient)

    // WHEN — call and ignore the error
    await adapter.removeContacto(CONTACTO_ID).catch(() => null)

    // THEN — queryClient.invalidateQueries was NOT called
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-05 [P1]
  // Given apiClient.put resolves successfully
  // When assignContacto(contactoId) is called
  // Then toast.success is called with "Contacto asociado correctamente" (Spanish — company standard)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-42-EDGE-05 — assignContacto() llama toast.success("Contacto asociado correctamente")', async () => {
    // GIVEN — PUT resolves
    mockPut.mockResolvedValueOnce({ data: { id: CONTACTO_ID, clienteId: CLIENT_ID } })
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN
    await adapter.assignContacto(CONTACTO_ID)

    // THEN — success toast shown with Spanish message
    expect(mockToastSuccess).toHaveBeenCalledTimes(1)
    expect(mockToastSuccess).toHaveBeenCalledWith('Contacto asociado correctamente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-06 [P1]
  // Given apiClient.put resolves successfully
  // When removeContacto(contactoId) is called
  // Then toast.success is called with "Contacto desasociado correctamente" (Spanish — company standard)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-42-EDGE-06 — removeContacto() llama toast.success("Contacto desasociado correctamente")', async () => {
    // GIVEN — PUT resolves
    mockPut.mockResolvedValueOnce({ data: { id: CONTACTO_ID, clienteId: null } })
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN
    await adapter.removeContacto(CONTACTO_ID)

    // THEN — success toast shown with Spanish message
    expect(mockToastSuccess).toHaveBeenCalledTimes(1)
    expect(mockToastSuccess).toHaveBeenCalledWith('Contacto desasociado correctamente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-07 [P2]
  // Given apiClient.put rejects
  // When assignContacto(contactoId) throws
  // Then toast.success is NOT called (no false success feedback on failure)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-42-EDGE-07 — assignContacto() não chama toast.success quando PUT falla', async () => {
    // GIVEN — PUT rejects
    mockPut.mockRejectedValueOnce(new Error('Server Error'))
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN — call and absorb error
    await adapter.assignContacto(CONTACTO_ID).catch(() => null)

    // THEN — toast.success was NOT called
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-08 [P2]
  // Given two consecutive calls to assignContacto() with different contactoIds
  // When both succeed
  // Then invalidateQueries is called 4 times total (2 per call: global + clienteId-scoped)
  //   AND each call uses the correct contactoId in the PUT URL
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-42-EDGE-08 — dos assignContacto() consecutivos invalidan ambas query keys cada vez', async () => {
    // GIVEN — two successful PUTs
    const CONTACTO_ID_1 = '11111111-1111-4111-8111-111111111111'
    const CONTACTO_ID_2 = '22222222-2222-4222-8222-222222222222'

    mockPut
      .mockResolvedValueOnce({ data: { id: CONTACTO_ID_1, clienteId: CLIENT_ID } })
      .mockResolvedValueOnce({ data: { id: CONTACTO_ID_2, clienteId: CLIENT_ID } })

    const queryClient = makeMockQueryClient()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, queryClient)

    // WHEN — two consecutive associations
    await adapter.assignContacto(CONTACTO_ID_1)
    await adapter.assignContacto(CONTACTO_ID_2)

    // THEN — invalidateQueries called 4 times total (2 per call)
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4)

    // AND — global key invalidated twice
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contactos'] })

    // AND — scoped key invalidated twice
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ['contactos', { clienteId: CLIENT_ID }] }
    )

    // AND — each call used its own contactoId in the URL
    expect(mockPut).toHaveBeenNthCalledWith(
      1,
      `/api/v1/contactos/${CONTACTO_ID_1}/cliente`,
      { clienteId: CLIENT_ID }
    )
    expect(mockPut).toHaveBeenNthCalledWith(
      2,
      `/api/v1/contactos/${CONTACTO_ID_2}/cliente`,
      { clienteId: CLIENT_ID }
    )
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-09 [P2]
  // Given removeContacto() is called
  // When apiClient.put is invoked
  // Then the body contains { clienteId: null } — NOT { clienteId: undefined }
  //   (undefined would be omitted by JSON.stringify; null is the explicit disassociation value)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-42-EDGE-09 — removeContacto() envía { clienteId: null } (no undefined)', async () => {
    // GIVEN — PUT resolves
    mockPut.mockResolvedValueOnce({ data: { id: CONTACTO_ID, clienteId: null } })
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN
    await adapter.removeContacto(CONTACTO_ID)

    // THEN — PUT called with explicit null (not undefined)
    const callArgs = mockPut.mock.calls[0]
    const bodyArg = callArgs[1] as { clienteId: unknown }
    expect(bodyArg).toHaveProperty('clienteId')
    expect(bodyArg.clienteId).toBeNull()
    expect(bodyArg.clienteId).not.toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // UNIT-42-EDGE-10 [P2]
  // Given two different contactoIds passed to assignContacto()
  // When each is called
  // Then each PUT uses its own contactoId in the URL (no contamination from closure)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-42-EDGE-10 — assignContacto() genera URLs distintas para distintos contactoIds', async () => {
    // GIVEN — two different contacto IDs
    const ID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const ID_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

    mockPut
      .mockResolvedValueOnce({ data: { id: ID_A, clienteId: CLIENT_ID } })
      .mockResolvedValueOnce({ data: { id: ID_B, clienteId: CLIENT_ID } })

    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient())

    // WHEN
    await adapter.assignContacto(ID_A)
    await adapter.assignContacto(ID_B)

    // THEN — first PUT used ID_A, second used ID_B
    expect(mockPut.mock.calls[0][0]).toBe(`/api/v1/contactos/${ID_A}/cliente`)
    expect(mockPut.mock.calls[1][0]).toBe(`/api/v1/contactos/${ID_B}/cliente`)
  })
})

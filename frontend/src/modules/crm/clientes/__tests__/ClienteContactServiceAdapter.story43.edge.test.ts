import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Edge Case Tests — Story 4.3: onContactClick navigation in ClienteContactServiceAdapter
 *
 * Expands ATDD baseline (UNIT-AC-06, UNIT-AC-07 in ClienteContactServiceAdapter.test.ts) with:
 *   - UNIT-43-EDGE-01 [P1] onContactClick() is called once per invocation (no double-fire)
 *   - UNIT-43-EDGE-02 [P1] onContactClick() uses the exact route template '/contactos/$contactoId'
 *   - UNIT-43-EDGE-03 [P1] onContactClick() passes contactoId as the params value (not as query param)
 *   - UNIT-43-EDGE-04 [P1] two consecutive onContactClick() calls each use their own contactoId
 *   - UNIT-43-EDGE-05 [P1] onContactClick() with empty-string contactoId still calls navigate (no guard)
 *   - UNIT-43-EDGE-06 [P2] onContactClick() with uppercase UUID passes through as-is (no normalization)
 *   - UNIT-43-EDGE-07 [P2] navigate receives no extra keys beyond 'to' and 'params'
 *   - UNIT-43-EDGE-08 [P2] onContactClick() does not call apiClient (navigation-only, no side effect)
 *   - UNIT-43-EDGE-09 [P2] onContactClick() does not call queryClient.invalidateQueries
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
import { ClienteContactServiceAdapter } from '../presentation/ClienteContactServiceAdapter'

const CLIENT_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const CONTACTO_ID = '550e8400-e29b-41d4-a716-446655440099'

function makeMockQueryClient(): QueryClient {
  return { invalidateQueries: vi.fn() } as unknown as QueryClient
}

describe('ClienteContactServiceAdapter — Story 4.3 onContactClick Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-01 [P1]
  // Given a navigate function is wired to the adapter
  // When onContactClick(contactoId) is called exactly once
  // Then navigate is invoked exactly once (no double-fire or accumulated calls)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-43-EDGE-01 — onContactClick() invoca navigate exactamente una vez por llamada', () => {
    // GIVEN — navigate mock
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN — single invocation
    adapter.onContactClick(CONTACTO_ID)

    // THEN — navigate called exactly once
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-02 [P1]
  // Given a navigate function is wired to the adapter
  // When onContactClick(contactoId) is called
  // Then navigate receives the exact route template '/contactos/$contactoId'
  //   (NOT '/contactos/:contactoId', NOT '/contactos/${contactoId}', NOT a resolved URL)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-43-EDGE-02 — onContactClick() usa el template de ruta exacto "/contactos/$contactoId"', () => {
    // GIVEN
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN
    adapter.onContactClick(CONTACTO_ID)

    // THEN — route template is the TanStack Router file-based template (with $)
    const callArgs = mockNavigate.mock.calls[0][0] as { to: string; params: Record<string, string> }
    expect(callArgs.to).toBe('/contactos/$contactoId')
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-03 [P1]
  // Given a navigate function is wired to the adapter
  // When onContactClick(contactoId) is called
  // Then navigate receives { params: { contactoId: <the given id> } }
  //   — the contactoId is in params, not in the 'to' string or a query object
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-43-EDGE-03 — onContactClick() pasa el contactoId en params, no en la ruta resuelta', () => {
    // GIVEN
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN
    adapter.onContactClick(CONTACTO_ID)

    // THEN — contactoId is in params object
    const callArgs = mockNavigate.mock.calls[0][0] as { to: string; params: Record<string, string> }
    expect(callArgs.params).toBeDefined()
    expect(callArgs.params.contactoId).toBe(CONTACTO_ID)

    // AND — the 'to' string does NOT contain the raw UUID (it uses the $ template param)
    expect(callArgs.to).not.toContain(CONTACTO_ID)
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-04 [P1]
  // Given two consecutive calls to onContactClick() with different contactoIds
  // When both are called
  // Then each call passes its own contactoId — no ID leakage between calls
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-43-EDGE-04 — dos onContactClick() consecutivos usan cada uno su propio contactoId', () => {
    // GIVEN — two different contact IDs
    const ID_FIRST = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const ID_SECOND = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN — two consecutive click events
    adapter.onContactClick(ID_FIRST)
    adapter.onContactClick(ID_SECOND)

    // THEN — navigate called twice with distinct contactoIds
    expect(mockNavigate).toHaveBeenCalledTimes(2)

    const firstCallParams = (mockNavigate.mock.calls[0][0] as { params: { contactoId: string } }).params
    const secondCallParams = (mockNavigate.mock.calls[1][0] as { params: { contactoId: string } }).params

    expect(firstCallParams.contactoId).toBe(ID_FIRST)
    expect(secondCallParams.contactoId).toBe(ID_SECOND)
    expect(firstCallParams.contactoId).not.toBe(secondCallParams.contactoId)
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-05 [P1]
  // Given an empty string is passed as contactoId (boundary condition)
  // When onContactClick('') is called
  // Then navigate is still called (no guard that prevents calling navigate for empty string)
  // Note: input validation is the caller's responsibility; the adapter forwards any value
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-43-EDGE-05 — onContactClick("") llama navigate igualmente (sin guard de string vacío)', () => {
    // GIVEN
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN — call with empty string
    adapter.onContactClick('')

    // THEN — navigate was still called
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    const callArgs = mockNavigate.mock.calls[0][0] as { params: { contactoId: string } }
    expect(callArgs.params.contactoId).toBe('')
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-06 [P2]
  // Given a contactoId with uppercase letters (non-normalized UUID)
  // When onContactClick(uppercaseId) is called
  // Then navigate receives the ID exactly as passed (no toLowerCase normalization applied)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-43-EDGE-06 — onContactClick() pasa el UUID en mayúsculas tal como fue recibido (sin normalizar)', () => {
    // GIVEN — uppercase UUID
    const uppercaseId = '550E8400-E29B-41D4-A716-446655440099'
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN
    adapter.onContactClick(uppercaseId)

    // THEN — ID passed through as-is
    const callArgs = mockNavigate.mock.calls[0][0] as { params: { contactoId: string } }
    expect(callArgs.params.contactoId).toBe(uppercaseId)
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-07 [P2]
  // Given a navigate function is wired to the adapter
  // When onContactClick(contactoId) is called
  // Then the navigate argument object contains ONLY 'to' and 'params' keys
  //   (no extra keys like 'search', 'hash', 'state', etc. — minimal navigation payload)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-43-EDGE-07 — onContactClick() llama navigate con solo las claves "to" y "params"', () => {
    // GIVEN
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)

    // WHEN
    adapter.onContactClick(CONTACTO_ID)

    // THEN — navigate called with object containing only 'to' and 'params'
    const callArgs = mockNavigate.mock.calls[0][0] as Record<string, unknown>
    expect(Object.keys(callArgs).sort()).toEqual(['params', 'to'])
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-08 [P2]
  // Given onContactClick() is invoked
  // When it executes
  // Then apiClient is NOT called (navigation is client-side only — no API side effect)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-43-EDGE-08 — onContactClick() no llama a apiClient (navegación pura, sin efectos API)', () => {
    // GIVEN
    const mockNavigate = vi.fn()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, makeMockQueryClient(), mockNavigate)
    const mockGet = apiClient.get as ReturnType<typeof vi.fn>
    const mockPut = apiClient.put as ReturnType<typeof vi.fn>

    // WHEN
    adapter.onContactClick(CONTACTO_ID)

    // THEN — no API calls
    expect(mockGet).not.toHaveBeenCalled()
    expect(mockPut).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-43-EDGE-09 [P2]
  // Given onContactClick() is invoked
  // When it executes
  // Then queryClient.invalidateQueries is NOT called
  //   (navigation does not invalidate cache — cache invalidation is for write operations only)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-43-EDGE-09 — onContactClick() no invalida el queryClient (no es una operación de escritura)', () => {
    // GIVEN
    const mockNavigate = vi.fn()
    const queryClient = makeMockQueryClient()
    const adapter = new ClienteContactServiceAdapter(CLIENT_ID, queryClient, mockNavigate)

    // WHEN
    adapter.onContactClick(CONTACTO_ID)

    // THEN — no cache invalidation
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })
})

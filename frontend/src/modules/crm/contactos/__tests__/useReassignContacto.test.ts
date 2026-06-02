import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

/**
 * ATDD — Story 4.6: Reassign Contact to Different Client
 * Frontend Unit Tests — useReassignContacto mutation hook
 *
 * RED Phase — Tests intentionally fail until implementation is complete.
 * Make these tests GREEN by implementing:
 *   frontend/src/modules/crm/contactos/application/useReassignContacto.ts
 *
 * Unit Coverage:
 *   UNIT-AC-06  P1  · AC2  — mutationFn calls contactoApiRepository.assignCliente
 *                            with the correct contactoId and newClienteId arguments
 *   UNIT-AC-07  P1  · AC2  — onSuccess invalidates ['contactos'],
 *                            ['contactos', { clienteId: oldId }] and
 *                            ['contactos', { clienteId: newId }]
 *   UNIT-AC-08  P1  · AC2  — onSuccess fires toast.success('Contacto reasignado correctamente')
 *   UNIT-AC-09  P1  · AC2  — When oldClienteId is null, key
 *                            ['contactos', { clienteId: null }] is NOT invalidated
 */

// Mock the repository module
vi.mock('../infrastructure/contactoApiRepository', () => ({
  contactoApiRepository: {
    assignCliente: vi.fn(),
  },
}))

// Mock the toast store
vi.mock('../../../../shared/lib/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import { toast } from '../../../../shared/lib/toastStore'
import { useReassignContacto } from '../application/useReassignContacto'

const mockAssignCliente = contactoApiRepository.assignCliente as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>

const CONTACTO_ID = '550e8400-e29b-41d4-a716-446655440001'
const OLD_CLIENTE_ID = '11111111-1111-4111-8111-111111111111'
const NEW_CLIENTE_ID = '22222222-2222-4222-8222-222222222222'

function createWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

describe('useReassignContacto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-06 (P1 · AC2)
  // Given the hook is mounted with a contactoId and oldClienteId
  // When the mutation is fired with a newClienteId
  // Then contactoApiRepository.assignCliente is called with (contactoId, newClienteId)
  // ---------------------------------------------------------------------------
  it('UNIT-AC-06 — mutationFn calls contactoApiRepository.assignCliente with correct contactoId and newClienteId', async () => {
    // GIVEN
    mockAssignCliente.mockResolvedValueOnce({
      id: CONTACTO_ID,
      clienteId: NEW_CLIENTE_ID,
    })
    const { wrapper } = createWrapperWithClient()

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, OLD_CLIENTE_ID),
      { wrapper }
    )

    // WHEN — Trigger the mutation
    result.current.mutate(NEW_CLIENTE_ID)

    // THEN — The repository method was called with the correct args
    await waitFor(() => expect(mockAssignCliente).toHaveBeenCalledTimes(1))
    expect(mockAssignCliente).toHaveBeenCalledWith(CONTACTO_ID, NEW_CLIENTE_ID)
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-07 (P1 · AC2)
  // Given the hook is mounted with a non-null oldClienteId
  // When the mutation succeeds
  // Then queryClient invalidates ['contactos'],
  //      ['contactos', { clienteId: oldId }] and
  //      ['contactos', { clienteId: newId }]
  // ---------------------------------------------------------------------------
  it('UNIT-AC-07 — onSuccess invalidates [contactos], [contactos, {clienteId: oldId}] and [contactos, {clienteId: newId}]', async () => {
    // GIVEN
    mockAssignCliente.mockResolvedValueOnce({
      id: CONTACTO_ID,
      clienteId: NEW_CLIENTE_ID,
    })
    const { queryClient, wrapper } = createWrapperWithClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, OLD_CLIENTE_ID),
      { wrapper }
    )

    // WHEN — Trigger the mutation and wait for success
    result.current.mutate(NEW_CLIENTE_ID)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN — invalidateQueries called with all three required keys
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey)

    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        ['contactos'],
        ['contactos', { clienteId: OLD_CLIENTE_ID }],
        ['contactos', { clienteId: NEW_CLIENTE_ID }],
      ])
    )
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-08 (P1 · AC2)
  // Given the hook is mounted
  // When the mutation succeeds
  // Then toast.success is called with the exact Spanish message
  //      'Contacto reasignado correctamente'
  // ---------------------------------------------------------------------------
  it('UNIT-AC-08 — onSuccess calls toast.success("Contacto reasignado correctamente")', async () => {
    // GIVEN
    mockAssignCliente.mockResolvedValueOnce({
      id: CONTACTO_ID,
      clienteId: NEW_CLIENTE_ID,
    })
    const { wrapper } = createWrapperWithClient()

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, OLD_CLIENTE_ID),
      { wrapper }
    )

    // WHEN
    result.current.mutate(NEW_CLIENTE_ID)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN
    expect(mockToastSuccess).toHaveBeenCalledWith('Contacto reasignado correctamente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-AC-09 (P1 · AC2)
  // Given the hook is mounted with oldClienteId === null
  // When the mutation succeeds
  // Then the key ['contactos', { clienteId: null }] is NOT invalidated
  //   AND ['contactos'] and ['contactos', { clienteId: newId }] ARE invalidated
  // ---------------------------------------------------------------------------
  it('UNIT-AC-09 — when oldClienteId is null, ["contactos", {clienteId: null}] key is NOT invalidated', async () => {
    // GIVEN — oldClienteId is null
    mockAssignCliente.mockResolvedValueOnce({
      id: CONTACTO_ID,
      clienteId: NEW_CLIENTE_ID,
    })
    const { queryClient, wrapper } = createWrapperWithClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, null),
      { wrapper }
    )

    // WHEN
    result.current.mutate(NEW_CLIENTE_ID)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN — No invalidation of the null-keyed query
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey)

    const nullKeyInvalidated = invalidatedKeys.some(
      (key) =>
        Array.isArray(key) &&
        key.length === 2 &&
        key[0] === 'contactos' &&
        typeof key[1] === 'object' &&
        key[1] !== null &&
        'clienteId' in (key[1] as Record<string, unknown>) &&
        (key[1] as { clienteId: unknown }).clienteId === null
    )
    expect(nullKeyInvalidated).toBe(false)

    // AND — Global key and new-cliente key are still invalidated
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        ['contactos'],
        ['contactos', { clienteId: NEW_CLIENTE_ID }],
      ])
    )
  })
})

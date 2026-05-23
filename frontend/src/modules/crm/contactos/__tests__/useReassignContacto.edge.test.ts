import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

/**
 * Unit Edge Case Tests — Story 4.6: useReassignContacto mutation hook
 *
 * Expands the ATDD baseline (useReassignContacto.test.ts — UNIT-AC-06..09) with edge cases:
 *
 *   UNIT-46-EDGE-01 [P1] onError fires toast.error with the Spanish failure message
 *   UNIT-46-EDGE-02 [P1] onError does NOT invalidate any query keys (no cache disruption on failure)
 *   UNIT-46-EDGE-03 [P1] mutate triggers exactly one assignCliente call per invocation (no duplicate calls)
 *   UNIT-46-EDGE-04 [P2] isPending=true while the mutation is in flight, false after settle
 *   UNIT-46-EDGE-05 [P2] onSuccess also invalidates ['contactos', contactoId] (detail key)
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
const mockToastError = toast.error as ReturnType<typeof vi.fn>

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

describe('useReassignContacto — Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-46-EDGE-01 [P1]
  // Given the assignCliente repository call rejects
  // When the mutation completes
  // Then onError fires toast.error with the Spanish message
  //      'No se pudo reasignar el contacto. Intenta de nuevo.'
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-46-EDGE-01 — onError dispara toast.error con el mensaje en español', async () => {
    // GIVEN — Repository rejects
    mockAssignCliente.mockRejectedValueOnce(new Error('Network failure'))
    const { wrapper } = createWrapperWithClient()

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, OLD_CLIENTE_ID),
      { wrapper }
    )

    // WHEN — Mutation fails
    result.current.mutate(NEW_CLIENTE_ID)
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN — Spanish error toast was raised
    expect(mockToastError).toHaveBeenCalledWith(
      'No se pudo reasignar el contacto. Intenta de nuevo.'
    )

    // AND — Success toast was NOT called
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-46-EDGE-02 [P1]
  // Given the mutation fails
  // When onError runs
  // Then queryClient.invalidateQueries is NOT called
  // (We must not invalidate caches on error — stale data is preferable to flicker)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-46-EDGE-02 — onError NO invalida queries (sin disrupción de caché en fallo)', async () => {
    // GIVEN
    mockAssignCliente.mockRejectedValueOnce(new Error('Server 500'))
    const { queryClient, wrapper } = createWrapperWithClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, OLD_CLIENTE_ID),
      { wrapper }
    )

    // WHEN
    result.current.mutate(NEW_CLIENTE_ID)
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN — invalidateQueries was not called by the hook
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-46-EDGE-03 [P1]
  // Given the hook is mounted once
  // When mutate is called once
  // Then assignCliente is invoked exactly once (no duplicate / re-render leaks)
  // (TanStack Query 5 mutations are not idempotent — multiple mutate() calls would
  //  produce multiple PUTs. This test guards against an accidental double-fire from
  //  React StrictMode or implementation regressions.)
  // ---------------------------------------------------------------------------
  it('[P1] UNIT-46-EDGE-03 — mutate única llama a assignCliente exactamente una vez', async () => {
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
    expect(mockAssignCliente).toHaveBeenCalledTimes(1)
    expect(mockAssignCliente).toHaveBeenCalledWith(CONTACTO_ID, NEW_CLIENTE_ID)
  })

  // ---------------------------------------------------------------------------
  // UNIT-46-EDGE-04 [P2]
  // Given the mutation is triggered
  // When the assignCliente promise has not resolved yet
  // Then isPending is true (allows the dialog to disable buttons)
  //   AND once the promise settles, isPending returns to false
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-46-EDGE-04 — isPending refleja el estado en vuelo de la mutación', async () => {
    // GIVEN — Use a manually controlled promise
    let resolveAssign!: (value: unknown) => void
    mockAssignCliente.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAssign = resolve
      })
    )
    const { wrapper } = createWrapperWithClient()

    const { result } = renderHook(
      () => useReassignContacto(CONTACTO_ID, OLD_CLIENTE_ID),
      { wrapper }
    )

    // Initial state — idle, not pending
    expect(result.current.isPending).toBe(false)

    // WHEN — Fire the mutation
    result.current.mutate(NEW_CLIENTE_ID)

    // THEN — isPending becomes true
    await waitFor(() => expect(result.current.isPending).toBe(true))

    // AND — After the promise resolves, isPending becomes false
    resolveAssign({ id: CONTACTO_ID, clienteId: NEW_CLIENTE_ID })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-46-EDGE-05 [P2]
  // Given the hook is mounted with contactoId
  // When the mutation succeeds
  // Then queryClient invalidates the contact-detail key ['contactos', contactoId]
  // (Detail panel must reflect the new clienteId without manual refetch)
  // ---------------------------------------------------------------------------
  it('[P2] UNIT-46-EDGE-05 — onSuccess invalida la query de detalle ["contactos", contactoId]', async () => {
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

    // WHEN
    result.current.mutate(NEW_CLIENTE_ID)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN — ['contactos', contactoId] was invalidated
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey)
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([['contactos', CONTACTO_ID]])
    )
  })
})

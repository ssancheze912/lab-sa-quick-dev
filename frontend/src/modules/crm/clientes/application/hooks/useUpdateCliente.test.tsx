import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import {
  CLIENTE_BY_ID_ENDPOINT,
  clienteNitConflictProblemDetails,
} from '@/test/msw/handlers'
import { createCliente } from '@/test/factories/cliente.factory'
import { useUpdateCliente } from './useUpdateCliente'

// RED PHASE: `useUpdateCliente.ts` does not exist yet (Story 2.4, Task 4).
// These tests define the expected mutation-hook contract for AC #2, #5, #7,
// mirroring `useCreateCliente.test.tsx`'s exact structure:
//   - onSuccess invalidates BOTH the ['clientes'] AND ['clientes', id] query
//     caches (R6 — stale cache risk, the update affects the detail view too)
//   - onSuccess triggers the exact success toast copy "Cliente actualizado
//     correctamente" (TC-E2-P2-06, R11)
//   - a 409 response surfaces the "El NIT/RUC ya está registrado" message
//     WITHOUT a generic toast (AC #5 — left for the form to render inline)
//   - any other failure triggers the generic toast.error message
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// calling `renderHook` (the mutation itself fires only on `mutateAsync`).

vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

function renderUseUpdateCliente(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const { result } = renderHook(() => useUpdateCliente(id), { wrapper })
  return { result, invalidateSpy }
}

describe('useUpdateCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should invalidate the ["clientes"] list query cache on successful update', async () => {
    // GIVEN the backend accepts the update request (default MSW 200 handler)
    const cliente = createCliente()
    const { result, invalidateSpy } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed
    await result.current.mutateAsync({
      nombre: cliente.nombre,
      nit: cliente.nit,
      telefono: cliente.telefono,
      ciudad: 'Cali',
    })

    // THEN the ['clientes'] list query cache is invalidated
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    })
  })

  test('should invalidate the ["clientes", id] detail query cache on successful update (R6)', async () => {
    // GIVEN the backend accepts the update request
    const cliente = createCliente()
    const { result, invalidateSpy } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed
    await result.current.mutateAsync({
      nombre: cliente.nombre,
      nit: cliente.nit,
      telefono: cliente.telefono,
      ciudad: 'Cali',
    })

    // THEN the ['clientes', id] detail query cache is ALSO invalidated —
    // a query-key mismatch here would silently break FR27/NFR2 (R6)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes', cliente.id] })
    })
  })

  test('should call toast.success with the exact copy "Cliente actualizado correctamente" (TC-E2-P2-06)', async () => {
    // GIVEN the backend accepts the update request
    const { toast } = await import('siesa-ui-kit')
    const cliente = createCliente()
    const { result } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed successfully
    await result.current.mutateAsync({
      nombre: cliente.nombre,
      nit: cliente.nit,
      telefono: cliente.telefono,
      ciudad: cliente.ciudad,
    })

    // THEN the exact Spanish success toast copy is shown (no paraphrasing, R11)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cliente actualizado correctamente')
    })
  })

  test('should reject with the 409 error when the backend returns a duplicate NIT/RUC conflict', async () => {
    // GIVEN the backend returns 409 Problem Details for a duplicate NIT/RUC
    const cliente = createCliente()
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
      ),
    )
    const { result } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed
    // THEN the promise rejects (propagated, not swallowed) so the caller
    // (ClienteForm) can branch on the 409 status
    await expect(
      result.current.mutateAsync({
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      }),
    ).rejects.toBeDefined()
  })

  test('should NOT call toast.success or toast.error when the backend returns a 409 conflict (AC #5)', async () => {
    // GIVEN the backend returns 409 Problem Details
    const cliente = createCliente()
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
      ),
    )
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed and rejects
    await result.current
      .mutateAsync({
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      })
      .catch(() => null)

    // THEN neither toast fires for the 409 case — it's rendered inline by the form
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  test('should NOT invalidate any query cache when the update request fails with 409', async () => {
    // GIVEN the backend returns a 409 conflict
    const cliente = createCliente()
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
      ),
    )
    const { result, invalidateSpy } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation fails
    await result.current
      .mutateAsync({
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      })
      .catch(() => null)

    // THEN the cache is not invalidated for a failed mutation
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  test('should call toast.error with the generic message for a non-409 failure (e.g. 500)', async () => {
    // GIVEN the backend returns a generic 500 error
    const cliente = createCliente()
    server.use(http.put(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json({}, { status: 500 })))
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed and fails with a non-409 error
    await result.current
      .mutateAsync({
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      })
      .catch(() => null)

    // THEN the generic error toast copy is shown, same pattern as useCreateCliente
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  // --- Edge cases (testarch-automate expansion) -------------------------------

  test('should invalidate both query caches exactly once each on successful update (no duplicate invalidation)', async () => {
    // GIVEN the backend accepts the update request
    const cliente = createCliente()
    const { result, invalidateSpy } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed
    await result.current.mutateAsync({
      nombre: cliente.nombre,
      nit: cliente.nit,
      telefono: cliente.telefono,
      ciudad: cliente.ciudad,
    })

    // THEN each query key is invalidated exactly once — guards against a
    // regression that fires redundant invalidations (extra re-renders/fetches)
    await waitFor(() => {
      const listCalls = invalidateSpy.mock.calls.filter(
        ([arg]) => JSON.stringify(arg) === JSON.stringify({ queryKey: ['clientes'] }),
      )
      const detailCalls = invalidateSpy.mock.calls.filter(
        ([arg]) => JSON.stringify(arg) === JSON.stringify({ queryKey: ['clientes', cliente.id] }),
      )
      expect(listCalls).toHaveLength(1)
      expect(detailCalls).toHaveLength(1)
    })
  })

  test('should reject with a network error (no response) without throwing an unhandled exception', async () => {
    // GIVEN the backend is unreachable (simulated network failure, no HTTP response)
    const cliente = createCliente()
    server.use(http.put(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.error()))
    const { result } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation is executed against an unreachable backend
    // THEN the promise rejects cleanly (caller can catch it) instead of
    // crashing the hook or leaving the mutation stuck in a pending state
    await expect(
      result.current.mutateAsync({
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      }),
    ).rejects.toBeDefined()
  })

  test('should call toast.error with the generic message for a network error (no response object)', async () => {
    // GIVEN a network-level failure with no HTTP status/response at all —
    // distinct from the 409 case, this must NOT be silently treated as a
    // conflict (isAxiosError(error) is true but error.response is undefined)
    const cliente = createCliente()
    server.use(http.put(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.error()))
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseUpdateCliente(cliente.id)

    // WHEN the mutation fails at the network level
    await result.current
      .mutateAsync({
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      })
      .catch(() => null)

    // THEN the generic error toast fires (status !== 409, since there is no status at all)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  test('should target the URL matching the id passed to the hook (not a stale/different id)', async () => {
    // GIVEN two distinct client ids, each with its own PUT handler assertion
    const clienteA = createCliente()
    const clienteB = createCliente()
    let calledWithIdInUrl: string | null = null
    server.use(
      http.put('*/api/v1/clientes/:id', ({ params }) => {
        calledWithIdInUrl = params.id as string
        return HttpResponse.json(clienteB, { status: 200 })
      }),
    )
    const { result } = renderUseUpdateCliente(clienteB.id)

    // WHEN the mutation is executed for clienteB's hook instance
    await result.current.mutateAsync({
      nombre: clienteB.nombre,
      nit: clienteB.nit,
      telefono: clienteB.telefono,
      ciudad: clienteB.ciudad,
    })

    // THEN the request targets clienteB's id, never clienteA's (guards
    // against a stale-closure bug if `id` were captured incorrectly)
    expect(calledWithIdInUrl).toBe(clienteB.id)
    expect(calledWithIdInUrl).not.toBe(clienteA.id)
  })
})

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import {
  CLIENTE_BY_ID_ENDPOINT,
  clienteDeleteNotFoundProblemDetails,
} from '@/test/msw/handlers'
import { createCliente } from '@/test/factories/cliente.factory'
import { useDeleteCliente } from './useDeleteCliente'

// RED PHASE: `useDeleteCliente.ts` does not exist yet (Story 2.5, Task 4).
// These tests define the expected mutation-hook contract for AC #2, #3, #6,
// mirroring `useUpdateCliente.test.tsx`'s exact structure:
//   - onSuccess invalidates ONLY the ['clientes'] list query cache — NOT
//     ['clientes', id], since the detail query for a now-deleted client
//     should not be refetched (would 404, Dev Notes)
//   - onSuccess triggers ONE of two exact toast copies depending on whether
//     the deleted client had associated contacts (read from the
//     `X-Had-Associated-Contacts` response header via the repository)
//   - a 404 response triggers `toast.error('El cliente ya no existe.')`
//   - any other failure triggers the generic `toast.error('No se pudo
//     eliminar. Intenta de nuevo.')` pattern
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

function renderUseDeleteCliente() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const { result } = renderHook(() => useDeleteCliente(), { wrapper })
  return { result, invalidateSpy }
}

describe('useDeleteCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should invalidate the ["clientes"] list query cache on successful deletion (AC #2)', async () => {
    // GIVEN the backend accepts the delete request with no associated contacts
    // (default MSW 204 handler, no X-Had-Associated-Contacts header)
    const cliente = createCliente()
    const { result, invalidateSpy } = renderUseDeleteCliente()

    // WHEN the mutation is executed
    await result.current.mutateAsync(cliente.id)

    // THEN the ['clientes'] list query cache is invalidated
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    })
  })

  test('should NOT invalidate the ["clientes", id] detail query cache on successful deletion', async () => {
    // GIVEN the backend accepts the delete request
    const cliente = createCliente()
    const { result, invalidateSpy } = renderUseDeleteCliente()

    // WHEN the mutation is executed
    await result.current.mutateAsync(cliente.id)

    // THEN the detail query cache for the now-deleted client is deliberately
    // NOT invalidated (would trigger a refetch that 404s — Dev Notes)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    })
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['clientes', cliente.id] })
  })

  test('should call toast.success with "Cliente eliminado correctamente" when the client had NO associated contacts (AC #2, TC-E2-P2-07)', async () => {
    // GIVEN the backend returns 204 with no X-Had-Associated-Contacts header
    const { toast } = await import('siesa-ui-kit')
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () => new HttpResponse(null, { status: 204 })),
    )
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation is executed successfully
    await result.current.mutateAsync(cliente.id)

    // THEN the exact Spanish success toast copy (no-contacts variant) is shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cliente eliminado correctamente')
    })
  })

  test('should call toast.success with the orphaning copy when the client HAD associated contacts (AC #3, TC-E2-P0-04)', async () => {
    // GIVEN the backend returns 204 WITH the X-Had-Associated-Contacts: true header
    const { toast } = await import('siesa-ui-kit')
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () =>
        new HttpResponse(null, {
          status: 204,
          headers: { 'X-Had-Associated-Contacts': 'true' },
        }),
      ),
    )
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation is executed successfully
    await result.current.mutateAsync(cliente.id)

    // THEN the exact orphaning toast copy is shown — must never be the plain variant (R11)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
      )
    })
  })

  test('should NEVER call toast.success with the plain copy when contacts were associated (R11 — variants must not cross)', async () => {
    // GIVEN the backend signals associated contacts were orphaned
    const { toast } = await import('siesa-ui-kit')
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () =>
        new HttpResponse(null, {
          status: 204,
          headers: { 'X-Had-Associated-Contacts': 'true' },
        }),
      ),
    )
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation succeeds
    await result.current.mutateAsync(cliente.id)

    // THEN the simple "Cliente eliminado correctamente" toast is never shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
    expect(toast.success).not.toHaveBeenCalledWith('Cliente eliminado correctamente')
  })

  test('should call toast.error with "El cliente ya no existe." on a 404 response (AC #6)', async () => {
    // GIVEN the backend returns 404 Problem Details (client no longer exists)
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteDeleteNotFoundProblemDetails, { status: 404 }),
      ),
    )
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation is executed and fails with 404
    await result.current.mutateAsync(cliente.id).catch(() => null)

    // THEN the specific not-found error toast is shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El cliente ya no existe.')
    })
  })

  test('should NOT show a false-success toast when the backend returns 404 (AC #6)', async () => {
    // GIVEN the backend returns 404
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteDeleteNotFoundProblemDetails, { status: 404 }),
      ),
    )
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation fails with 404
    await result.current.mutateAsync(cliente.id).catch(() => null)

    // THEN no success toast fires
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
    expect(toast.success).not.toHaveBeenCalled()
  })

  test('should NOT invalidate any query cache when the delete request fails with 404', async () => {
    // GIVEN the backend returns 404
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteDeleteNotFoundProblemDetails, { status: 404 }),
      ),
    )
    const { result, invalidateSpy } = renderUseDeleteCliente()

    // WHEN the mutation fails
    await result.current.mutateAsync(cliente.id).catch(() => null)

    // THEN the cache is not invalidated for a failed mutation
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  test('should call toast.error with the generic message for a non-404 failure (e.g. 500)', async () => {
    // GIVEN the backend returns a generic 500 error
    const cliente = createCliente()
    server.use(http.delete(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json({}, { status: 500 })))
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation is executed and fails with a non-404 error
    await result.current.mutateAsync(cliente.id).catch(() => null)

    // THEN the generic error toast copy is shown (same pattern as other hooks)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
    })
  })

  test('should reject the promise on failure (propagated, not swallowed)', async () => {
    // GIVEN the backend returns 404
    const cliente = createCliente()
    server.use(
      http.delete(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json(clienteDeleteNotFoundProblemDetails, { status: 404 }),
      ),
    )
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation is executed
    // THEN the promise rejects so the caller can react (e.g. keep dialog open)
    await expect(result.current.mutateAsync(cliente.id)).rejects.toBeDefined()
  })

  // --- Edge cases ------------------------------------------------------------

  test('should target the URL matching the id passed to mutateAsync (not a stale/different id)', async () => {
    // GIVEN two distinct client ids
    const clienteA = createCliente()
    const clienteB = createCliente()
    let calledWithIdInUrl: string | null = null
    server.use(
      http.delete('*/api/v1/clientes/:id', ({ params }) => {
        calledWithIdInUrl = params.id as string
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation is executed for clienteB's id
    await result.current.mutateAsync(clienteB.id)

    // THEN the request targets clienteB's id, never clienteA's
    expect(calledWithIdInUrl).toBe(clienteB.id)
    expect(calledWithIdInUrl).not.toBe(clienteA.id)
  })

  test('should call toast.error with the generic message for a network error (no response object)', async () => {
    // GIVEN a network-level failure with no HTTP status/response at all —
    // must not be misclassified as the 404 case
    const cliente = createCliente()
    server.use(http.delete(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.error()))
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseDeleteCliente()

    // WHEN the mutation fails at the network level
    await result.current.mutateAsync(cliente.id).catch(() => null)

    // THEN the generic error toast fires (status !== 404, since there is no status at all)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
    })
  })
})

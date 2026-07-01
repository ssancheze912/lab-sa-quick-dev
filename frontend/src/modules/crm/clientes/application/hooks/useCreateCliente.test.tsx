import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import {
  CLIENTES_ENDPOINT,
  clienteNitConflictProblemDetails,
} from '@/test/msw/handlers'
import { createCliente } from '@/test/factories/cliente.factory'
import { useCreateCliente } from './useCreateCliente'

// RED PHASE: `useCreateCliente.ts` does not exist yet (Story 2.3, Task 4).
// These tests define the expected mutation-hook contract for AC #2, #5:
//   - onSuccess invalidates the ['clientes'] query cache
//   - onSuccess triggers the exact success toast copy (TC-E2-P2-05, R11)
//   - a 409 response surfaces the "El NIT/RUC ya está registrado" message
//     WITHOUT a generic toast (AC #5 requires the form to stay open with data
//     intact — handled by the caller, not this hook, which must expose the
//     discriminated error instead of swallowing it)
//
// Network-first: every test registers `server.use(...)` overrides BEFORE
// calling `renderHook` (which does not itself trigger the mutation — the
// mutation fires only on `mutateAsync`, called inside `waitFor`/`act`).

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

function renderUseCreateCliente() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const { result } = renderHook(() => useCreateCliente(), { wrapper })
  return { result, invalidateSpy }
}

describe('useCreateCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should invalidate the ["clientes"] query cache on successful create', async () => {
    // GIVEN the backend accepts the create request (default MSW 201 handler)
    const { result, invalidateSpy } = renderUseCreateCliente()
    const payload = { nombre: 'Cliente Nuevo SAS', nit: '900555666', telefono: '3005556677', ciudad: 'Cali' }

    // WHEN the mutation is executed
    await result.current.mutateAsync(payload)

    // THEN the ['clientes'] query cache is invalidated (mandatory pattern)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    })
  })

  test('should call toast.success with the exact copy "Cliente creado correctamente" (TC-E2-P2-05)', async () => {
    // GIVEN the backend accepts the create request
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateCliente()
    const payload = { nombre: 'Cliente Éxito SAS', nit: '900777888', telefono: '3007778899', ciudad: 'Medellín' }

    // WHEN the mutation is executed successfully
    await result.current.mutateAsync(payload)

    // THEN the exact Spanish success toast copy is shown (no paraphrasing, R11)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cliente creado correctamente')
    })
  })

  test('should reject with the 409 error when the backend returns a duplicate NIT/RUC conflict', async () => {
    // GIVEN the backend returns 409 Problem Details for a duplicate NIT/RUC
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
      ),
    )
    const { result } = renderUseCreateCliente()
    const payload = { ...createCliente() }

    // WHEN the mutation is executed
    // THEN the promise rejects (propagated, not swallowed) so the caller can
    // branch on the 409 status (mirrors useCliente's isAxiosError precedent)
    await expect(result.current.mutateAsync(payload)).rejects.toBeDefined()
  })

  test('should NOT call toast.success when the backend returns a 409 conflict', async () => {
    // GIVEN the backend returns 409 Problem Details
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
      ),
    )
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateCliente()
    const payload = { ...createCliente() }

    // WHEN the mutation is executed and rejects
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN no success toast is shown for the failure path
    expect(toast.success).not.toHaveBeenCalled()
  })

  test('should call toast.error with the generic message for a non-409 failure (e.g. 500)', async () => {
    // GIVEN the backend returns a generic 500 error
    server.use(http.post(CLIENTES_ENDPOINT, () => HttpResponse.json({}, { status: 500 })))
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateCliente()
    const payload = { ...createCliente() }

    // WHEN the mutation is executed and fails with a non-409 error
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN the generic error toast copy is shown per architecture's standard
    // mutation error pattern (409 is handled separately, not via toast)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  test('should NOT invalidate the query cache when the create request fails', async () => {
    // GIVEN the backend returns a 409 conflict
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
      ),
    )
    const { result, invalidateSpy } = renderUseCreateCliente()
    const payload = { ...createCliente() }

    // WHEN the mutation fails
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN the cache is not invalidated for a failed mutation
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

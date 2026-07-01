import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { CONTACTOS_ENDPOINT, contactoValidationErrorProblemDetails } from '@/test/msw/handlers'
import { createContacto } from '@/test/factories/contacto.factory'
import { useCreateContacto } from './useCreateContacto'

/**
 * Story 3.3 (AC #2, #5): `useCreateContacto.ts` mutation-hook contract tests.
 * Mirrors `useCreateCliente.test.tsx` (Story 2.3 precedent) exactly, with one
 * structural difference: `ContactoEntity` has no unique business key, so
 * there is no 409 path here — only 400 (validation, AC #5) and success (AC #2).
 * The 400 case is NOT toasted (left for `ContactoForm` to render inline per
 * AC #5) — mirrors `useCreateCliente`'s 409 discrimination pattern, applied
 * here to `status === 400` (per Dev Notes' `isAxiosError` precedent from
 * `useContacto`'s 404 check).
 *
 * RED PHASE: `useCreateContacto.ts` does not exist yet (Story 3.3, Task 4).
 *
 * Network-first: every test registers `server.use(...)` overrides BEFORE
 * calling `renderHook` (the mutation fires only on `mutateAsync`).
 */

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

function renderUseCreateContacto() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const { result } = renderHook(() => useCreateContacto(), { wrapper })
  return { result, invalidateSpy }
}

describe('useCreateContacto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should invalidate the ["contactos"] query cache on successful create', async () => {
    // GIVEN the backend accepts the create request (default MSW 201 handler)
    const { result, invalidateSpy } = renderUseCreateContacto()
    const payload = {
      nombre: 'Contacto Nuevo',
      cargo: 'Analista',
      telefono: '3005556677',
      email: 'contacto.nuevo@ejemplo.co',
    }

    // WHEN the mutation is executed
    await result.current.mutateAsync(payload)

    // THEN the ['contactos'] query cache is invalidated (R4, mandatory pattern,
    // must exactly match useContactos'/useContacto's existing key)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['contactos'] })
    })
  })

  test('should call toast.success with the exact copy "Contacto creado correctamente" (R10)', async () => {
    // GIVEN the backend accepts the create request
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateContacto()
    const payload = {
      nombre: 'Contacto Éxito',
      cargo: 'Gerente',
      telefono: '3007778899',
      email: 'contacto.exito@ejemplo.co',
    }

    // WHEN the mutation is executed successfully
    await result.current.mutateAsync(payload)

    // THEN the exact Spanish success toast copy is shown (no paraphrasing, R10)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Contacto creado correctamente')
    })
  })

  test('should reject with the 400 error when the backend returns a validation error', async () => {
    // GIVEN the backend returns 400 Problem Details for empty required fields
    server.use(
      http.post(CONTACTOS_ENDPOINT, () =>
        HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
      ),
    )
    const { result } = renderUseCreateContacto()
    const payload = { ...createContacto() }

    // WHEN the mutation is executed
    // THEN the promise rejects (propagated, not swallowed) so the caller
    // (ContactoForm) can branch on the 400 status and render inline (AC #5)
    await expect(result.current.mutateAsync(payload)).rejects.toBeDefined()
  })

  test('should NOT call toast.success when the backend returns a 400 validation error', async () => {
    // GIVEN the backend returns 400 Problem Details
    server.use(
      http.post(CONTACTOS_ENDPOINT, () =>
        HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
      ),
    )
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateContacto()
    const payload = { ...createContacto() }

    // WHEN the mutation is executed and rejects
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN no success toast is shown for the failure path
    expect(toast.success).not.toHaveBeenCalled()
  })

  test('should NOT call toast.error for a 400 validation error (must render inline, not toast, AC #5)', async () => {
    // GIVEN the backend returns 400 Problem Details
    server.use(
      http.post(CONTACTOS_ENDPOINT, () =>
        HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
      ),
    )
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateContacto()
    const payload = { ...createContacto() }

    // WHEN the mutation is executed and fails with a 400
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN no generic error toast is fired — the 400 case is left for
    // ContactoForm to render inline (AC #5), same discrimination as
    // useCreateCliente's 409 case
    expect(toast.error).not.toHaveBeenCalled()
  })

  test('should call toast.error with the generic message for a non-400 failure (e.g. 500)', async () => {
    // GIVEN the backend returns a generic 500 error
    server.use(http.post(CONTACTOS_ENDPOINT, () => HttpResponse.json({}, { status: 500 })))
    const { toast } = await import('siesa-ui-kit')
    const { result } = renderUseCreateContacto()
    const payload = { ...createContacto() }

    // WHEN the mutation is executed and fails with a non-400 error
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN the generic error toast copy is shown per architecture's standard
    // mutation error pattern (400 is handled separately, not via toast)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  test('should NOT invalidate the query cache when the create request fails', async () => {
    // GIVEN the backend returns a 400 validation error
    server.use(
      http.post(CONTACTOS_ENDPOINT, () =>
        HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
      ),
    )
    const { result, invalidateSpy } = renderUseCreateContacto()
    const payload = { ...createContacto() }

    // WHEN the mutation fails
    await result.current.mutateAsync(payload).catch(() => null)

    // THEN the cache is not invalidated for a failed mutation
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

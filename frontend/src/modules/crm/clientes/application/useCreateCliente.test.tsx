// -----------------------------------------------------------------------------
// Story 2.3 — Create Client
// Unit tests for useCreateCliente mutation hook.
// -----------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import type { Cliente } from '../domain/Cliente'
import { useCreateCliente } from './useCreateCliente'

// Spy on toast functions from siesa-ui-kit. Assign the same fns to the object
// so `toast.success(...)` / `toast.error(...)` invocations are observable.
const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: Object.assign(vi.fn(), {
      success: (...args: unknown[]) => toastSuccess(...args),
      error: (...args: unknown[]) => toastError(...args),
      warning: vi.fn(),
      info: vi.fn(),
    }),
  }
})

const validPayload = {
  nombre: 'Nuevo Cliente SA',
  nit: '999888777-1',
  telefono: '+57 300 555 0000',
  ciudad: 'Medellín',
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, Wrapper }
}

describe('useCreateCliente', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it('happy path: 201 → data resolves, cache updated at head, toast.success called', async () => {
    const { client, Wrapper } = makeWrapper()
    // Seed the cache so we can assert head-insert semantics.
    const existing: Cliente[] = [
      {
        id: 'existing-1',
        nombre: 'Existing',
        nit: '000-1',
        telefono: '+57 000',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ]
    client.setQueryData(['clientes'], existing)

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })

    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nombre).toBe(validPayload.nombre)

    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached).toBeTruthy()
    expect(cached).toHaveLength(2)
    // Newest at index 0 (setQueryData((prev) => [dto, ...prev])).
    expect(cached?.[0].nombre).toBe(validPayload.nombre)
    expect(cached?.[1].id).toBe('existing-1')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(toastSuccess).toHaveBeenCalledTimes(1)
    expect(toastSuccess).toHaveBeenCalledWith(
      'Cliente creado correctamente',
      expect.objectContaining({ color: 'green', position: 'bottom-right', duration: 3000 }),
    )
    expect(toastError).not.toHaveBeenCalled()
  })

  it('409 path: does NOT trigger toast.error (business error is handled inline)', async () => {
    // Default handler already returns 409 when the NIT collides with seed.
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })

    result.current.mutate({ ...validPayload, nit: '900123456-7' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(409)
    expect(toastError).not.toHaveBeenCalled()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('500 path: triggers toast.error with the exact copy', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })

    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(500)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(toastError).toHaveBeenCalledWith(
      'No se pudo guardar. Intenta de nuevo.',
      expect.objectContaining({ color: 'red', position: 'bottom-right', duration: 5000 }),
    )
  })
})

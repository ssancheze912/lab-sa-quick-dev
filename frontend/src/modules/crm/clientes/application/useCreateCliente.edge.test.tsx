// -----------------------------------------------------------------------------
// Story 2.3 — Create Client (BMad-Integrated automate expansion)
// Edge-case tests for useCreateCliente mutation hook.
//
// Complements useCreateCliente.test.tsx (happy / 409 / 500) with paths the
// baseline suite does not exercise:
//   - Cache miss: no ['clientes'] pre-seeded → still inserts head-first without
//     throwing (prev === undefined branch of setQueryData).
//   - Toast copy on non-409 errors (400, 429, 503) is uniform.
//   - No cache invalidation on error (invalidateQueries only fires on success).
//   - Multiple sequential successful mutations accumulate at the head in order.
// -----------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import type { Cliente } from '../domain/Cliente'
import { useCreateCliente } from './useCreateCliente'

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
  nombre: 'Edge Cliente',
  nit: '111-edge',
  telefono: '+57 300 000 1234',
  ciudad: 'Cali',
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

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
})

describe('useCreateCliente — cache edge cases', () => {
  it('[P1] cache miss (no prior ["clientes"] entry) still seeds the cache with the new item', async () => {
    const { client, Wrapper } = makeWrapper()
    // Explicitly do NOT prime the cache — mimic a fresh app that hasn't visited /clientes yet.
    expect(client.getQueryData<Cliente[]>(['clientes'])).toBeUndefined()

    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached).toBeDefined()
    expect(cached).toHaveLength(1)
    expect(cached?.[0].nombre).toBe(validPayload.nombre)
  })

  it('[P2] sequential successful mutations accumulate newest-first at the head', async () => {
    const { client, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })

    result.current.mutate({ ...validPayload, nit: 'seq-1', nombre: 'First' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // reset() clears the mutation state so the next mutate() re-runs onSuccess.
    result.current.reset()

    result.current.mutate({ ...validPayload, nit: 'seq-2', nombre: 'Second' })
    await waitFor(() => expect(result.current.data?.nombre).toBe('Second'))

    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached).toBeDefined()
    // Newest at index 0.
    expect(cached?.[0].nombre).toBe('Second')
    expect(cached?.[1].nombre).toBe('First')
  })
})

describe('useCreateCliente — error toast uniformity', () => {
  it.each([
    [400, 'Uno o más campos son inválidos.'],
    [429, 'Too Many Requests'],
    [503, 'Service Unavailable'],
  ])(
    '[P2] non-409 status %i triggers the red error toast with the fixed Spanish copy',
    async (status, title) => {
      server.use(
        http.post('*/api/v1/clientes', () =>
          HttpResponse.json({ status, title }, { status }),
        ),
      )
      const { Wrapper } = makeWrapper()
      const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })

      result.current.mutate({ ...validPayload, nit: `nit-${status}` })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.response?.status).toBe(status)

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastError).toHaveBeenCalledWith(
        'No se pudo guardar. Intenta de nuevo.',
        expect.objectContaining({ color: 'red', position: 'bottom-right', duration: 5000 }),
      )
      expect(toastSuccess).not.toHaveBeenCalled()
    },
  )
})

describe('useCreateCliente — cache is NOT touched on failure', () => {
  it('[P1] on 409 the ["clientes"] cache is left intact (no optimistic write)', async () => {
    const { client, Wrapper } = makeWrapper()
    const previous: Cliente[] = [
      {
        id: 'existing',
        nombre: 'Existing Only',
        nit: '000-only',
        telefono: '+57 300',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ]
    client.setQueryData(['clientes'], previous)

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    // Nit '900123456-7' matches the seed → the MSW default handler returns 409.
    result.current.mutate({ ...validPayload, nit: '900123456-7' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Cache unchanged.
    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached).toEqual(previous)

    // Cache invalidation is a success-only side effect.
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('[P2] on 500 the ["clientes"] cache is left intact', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )
    const { client, Wrapper } = makeWrapper()
    const previous: Cliente[] = [
      {
        id: 'e2',
        nombre: 'Only',
        nit: '000-e2',
        telefono: '+57 300',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ]
    client.setQueryData(['clientes'], previous)

    const { Wrapper: W2 } = makeWrapper()
    // Reuse `client` inside a wrapper we control so we can inspect it after.
    const localWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    void W2

    const { result } = renderHook(() => useCreateCliente(), { wrapper: localWrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData<Cliente[]>(['clientes'])).toEqual(previous)
  })
})

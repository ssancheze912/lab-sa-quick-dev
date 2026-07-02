// -----------------------------------------------------------------------------
// Story 2.4 — Edit Client (BMad-Integrated automate expansion)
// Edge-case tests for the useUpdateCliente mutation hook.
//
// Complements useUpdateCliente.test.tsx (happy / 409 / 404 / 500) with paths
// the baseline suite does not exercise:
//   - Cache miss: no ['clientes'] pre-seeded → prev.map still runs safely
//     (returns undefined via the ternary — no crash).
//   - byId cache is ALWAYS refreshed on success, even when the list cache is
//     absent (setQueryData on ['clientes', id] is unconditional).
//   - Uniform red-toast copy across 400/422/429/502/503 non-409 errors.
//   - 409 leaves the ['clientes'] cache intact (no unintended invalidation).
//   - Sequential updates on the same id preserve list position and refresh
//     the byId cache each time.
//   - 404 invalidates ['clientes'] (defensive refresh so the ghost row vanishes)
//     but does NOT invalidate ['clientes', id] (that key is refetched by the
//     detail view naturally on next navigation).
// -----------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import type { Cliente } from '../domain/Cliente'
import { useUpdateCliente } from './useUpdateCliente'

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

const seedId = '11111111-1111-1111-1111-111111111111'

const validPayload = {
  nombre: 'Acme Updated',
  nit: '900123456-7',
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

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
})

describe('useUpdateCliente — cache edge cases', () => {
  it('[P1] cache miss (no ["clientes"] pre-seeded) still writes byId cache without crashing', async () => {
    const { client, Wrapper } = makeWrapper()
    // Intentionally do NOT seed the list cache — simulates a user landing
    // directly on /clientes/:id without visiting /clientes first.
    expect(client.getQueryData<Cliente[]>(['clientes'])).toBeUndefined()

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // List cache stays undefined — the ternary in useUpdateCliente.onSuccess
    // returns `prev` unchanged when it is undefined (no crash, no spurious seed).
    expect(client.getQueryData<Cliente[]>(['clientes'])).toBeUndefined()

    // byId cache is refreshed unconditionally.
    const byId = client.getQueryData<Cliente>(['clientes', seedId])
    expect(byId).toBeDefined()
    expect(byId?.nombre).toBe(validPayload.nombre)

    // Toast success still fires.
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })

  it('[P1] sequential updates on the same id refresh both caches each time', async () => {
    const { client, Wrapper } = makeWrapper()

    client.setQueryData<Cliente[]>(['clientes'], [
      {
        id: seedId,
        nombre: 'Acme Corp',
        nit: '900123456-7',
        telefono: '+57 300 111 1111',
        ciudad: 'Cali',
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
    ])

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })

    result.current.mutate({ ...validPayload, nombre: 'First Update' })
    await waitFor(() => expect(result.current.data?.nombre).toBe('First Update'))
    expect(client.getQueryData<Cliente>(['clientes', seedId])?.nombre).toBe('First Update')

    // reset() clears mutation state so the next mutate() re-triggers onSuccess.
    result.current.reset()

    result.current.mutate({ ...validPayload, nombre: 'Second Update' })
    await waitFor(() => expect(result.current.data?.nombre).toBe('Second Update'))

    const listCached = client.getQueryData<Cliente[]>(['clientes'])
    expect(listCached?.[0].nombre).toBe('Second Update')
    expect(client.getQueryData<Cliente>(['clientes', seedId])?.nombre).toBe('Second Update')

    // Two success toasts total.
    expect(toastSuccess).toHaveBeenCalledTimes(2)
    expect(toastError).not.toHaveBeenCalled()
  })

  it('[P1] target id in the middle of a 5-item list stays at its position after update', async () => {
    const { client, Wrapper } = makeWrapper()
    const list: Cliente[] = Array.from({ length: 5 }, (_, i) => ({
      id: i === 2 ? seedId : `id-${i}`,
      nombre: `Cliente ${i}`,
      nit: `nit-${i}`,
      telefono: '+57 300',
      ciudad: 'Cali',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    }))
    client.setQueryData<Cliente[]>(['clientes'], list)

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    result.current.mutate({ ...validPayload, nombre: 'Middle Renamed' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached).toHaveLength(5)
    // Same index as before (2), NOT reinserted at head — that's a Create-only
    // behaviour. Order-preservation is the R-004 invariant.
    expect(cached?.[0].id).toBe('id-0')
    expect(cached?.[1].id).toBe('id-1')
    expect(cached?.[2].id).toBe(seedId)
    expect(cached?.[2].nombre).toBe('Middle Renamed')
    expect(cached?.[3].id).toBe('id-3')
    expect(cached?.[4].id).toBe('id-4')
  })

  it('[P2] non-matching id in the cache leaves other entries untouched', async () => {
    const { client, Wrapper } = makeWrapper()
    const list: Cliente[] = [
      {
        id: seedId,
        nombre: 'Target',
        nit: 'nit-target',
        telefono: '+57 300',
        ciudad: 'Cali',
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
      {
        id: 'other-id',
        nombre: 'Untouched',
        nit: 'nit-other',
        telefono: '+57 301',
        ciudad: 'Bogotá',
        createdAt: '2026-06-02T10:00:00Z',
        updatedAt: '2026-06-02T10:00:00Z',
      },
    ]
    client.setQueryData<Cliente[]>(['clientes'], list)

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    result.current.mutate({ ...validPayload, nombre: 'Target Renamed' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached?.[0].nombre).toBe('Target Renamed')
    // The non-matching entry is preserved byte-for-byte.
    expect(cached?.[1]).toEqual(list[1])
  })
})

describe('useUpdateCliente — error toast uniformity', () => {
  it.each([
    [400, 'Uno o más campos son inválidos.'],
    [422, 'Unprocessable Entity'],
    [429, 'Too Many Requests'],
    [502, 'Bad Gateway'],
    [503, 'Service Unavailable'],
  ])(
    '[P2] non-409/404 status %i triggers the fixed red-toast copy',
    async (status, title) => {
      server.use(
        http.put('*/api/v1/clientes/:id', () =>
          HttpResponse.json({ status, title }, { status }),
        ),
      )
      const { Wrapper } = makeWrapper()
      const { result } = renderHook(() => useUpdateCliente(seedId), {
        wrapper: Wrapper,
      })

      result.current.mutate(validPayload)

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.response?.status).toBe(status)

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastError).toHaveBeenCalledWith(
        'No se pudo guardar. Intenta de nuevo.',
        expect.objectContaining({
          color: 'red',
          position: 'bottom-right',
          duration: 5000,
        }),
      )
      expect(toastSuccess).not.toHaveBeenCalled()
    },
  )
})

describe('useUpdateCliente — cache is NOT touched on failure', () => {
  it('[P1] on 409 the ["clientes"] cache is left intact (no in-place write, no invalidation)', async () => {
    const { client, Wrapper } = makeWrapper()
    const previous: Cliente[] = [
      {
        id: seedId,
        nombre: 'Untouched On 409',
        nit: '900123456-7',
        telefono: '+57 300',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ]
    client.setQueryData<Cliente[]>(['clientes'], previous)

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    // NIT '800987654-3' matches a DIFFERENT row in the MSW seed → 409.
    result.current.mutate({ ...validPayload, nit: '800987654-3' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Cache unchanged.
    expect(client.getQueryData<Cliente[]>(['clientes'])).toEqual(previous)

    // 409 does NOT call invalidateQueries — that's a 404-only defensive path.
    expect(invalidateSpy).not.toHaveBeenCalled()
    // No toast on 409 — business validation is handled inline by the form.
    expect(toastError).not.toHaveBeenCalled()
  })

  it('[P1] on 404 invalidates ["clientes"] but leaves the cache values intact', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado', status: 404 },
          { status: 404 },
        ),
      ),
    )
    const { client, Wrapper } = makeWrapper()
    const previous: Cliente[] = [
      {
        id: seedId,
        nombre: 'Ghost Row',
        nit: '900123456-7',
        telefono: '+57 300',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ]
    client.setQueryData<Cliente[]>(['clientes'], previous)

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Values still in cache — invalidate marks it stale but does not clear it.
    expect(client.getQueryData<Cliente[]>(['clientes'])).toEqual(previous)

    // Invalidation IS called on 404 — the row may have been deleted by another
    // session, so a refresh clears the ghost.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    // Only ONE invalidation call for 404 — the ['clientes', id] key is NOT
    // invalidated on 404 (only on success).
    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => c[0])
    expect(invalidatedKeys).toContainEqual({ queryKey: ['clientes'] })
    expect(invalidatedKeys).not.toContainEqual({ queryKey: ['clientes', seedId] })

    // Red toast fires as usual.
    expect(toastError).toHaveBeenCalledTimes(1)
  })

  it('[P2] on 500 the ["clientes"] cache is left intact and no invalidation runs', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )
    const { client, Wrapper } = makeWrapper()
    const previous: Cliente[] = [
      {
        id: seedId,
        nombre: 'Original',
        nit: '900123456-7',
        telefono: '+57 300',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
    ]
    client.setQueryData<Cliente[]>(['clientes'], previous)

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData<Cliente[]>(['clientes'])).toEqual(previous)
    // 500 is neither 404 nor 409 — invalidation is NOT called.
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

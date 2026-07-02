// -----------------------------------------------------------------------------
// Story 2.4 — Edit Client
// Unit tests for useUpdateCliente mutation hook.
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

describe('useUpdateCliente', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it('happy path: 200 → data resolves, list cache updated in-place, byId cache set, toast.success called', async () => {
    const { client, Wrapper } = makeWrapper()
    // Seed the list cache in the same order the app would.
    const seededList: Cliente[] = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        nombre: 'A',
        nit: '000-1',
        telefono: '+57 000',
        ciudad: 'Cali',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
      {
        id: seedId,
        nombre: 'Acme Corp',
        nit: '900123456-7',
        telefono: '+57 300 111 1111',
        ciudad: 'Cali',
        createdAt: '2026-06-02T00:00:00Z',
        updatedAt: '2026-06-02T00:00:00Z',
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        nombre: 'C',
        nit: '000-3',
        telefono: '+57 000',
        ciudad: 'Cali',
        createdAt: '2026-06-03T00:00:00Z',
        updatedAt: '2026-06-03T00:00:00Z',
      },
    ]
    client.setQueryData(['clientes'], seededList)

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })

    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nombre).toBe(validPayload.nombre)

    const cached = client.getQueryData<Cliente[]>(['clientes'])
    expect(cached).toBeTruthy()
    expect(cached).toHaveLength(3)
    // Order preserved — updated cliente stays at index 1, NOT reinserted at head.
    expect(cached?.[0].id).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    expect(cached?.[1].id).toBe(seedId)
    expect(cached?.[1].nombre).toBe(validPayload.nombre)
    expect(cached?.[2].id).toBe('cccccccc-cccc-cccc-cccc-cccccccccccc')

    // byId cache also refreshed.
    const byId = client.getQueryData<Cliente>(['clientes', seedId])
    expect(byId?.nombre).toBe(validPayload.nombre)

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes', seedId] })

    expect(toastSuccess).toHaveBeenCalledTimes(1)
    expect(toastSuccess).toHaveBeenCalledWith(
      'Cliente actualizado correctamente',
      expect.objectContaining({ color: 'green', position: 'bottom-right', duration: 3000 }),
    )
    expect(toastError).not.toHaveBeenCalled()
  })

  it('409 path: does NOT trigger toast.error (business error handled inline)', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })

    // Default handler returns 409 when the NIT collides against a DIFFERENT row.
    result.current.mutate({ ...validPayload, nit: '800987654-3' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(409)
    expect(toastError).not.toHaveBeenCalled()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('404 path: triggers red toast AND invalidates ["clientes"] to refresh ghost row', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado', status: 404 },
          { status: 404 },
        ),
      ),
    )
    const { client, Wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(404)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(toastError).toHaveBeenCalledWith(
      'No se pudo guardar. Intenta de nuevo.',
      expect.objectContaining({ color: 'red', position: 'bottom-right', duration: 5000 }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
  })

  it('500 path: triggers red toast with the exact copy', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateCliente(seedId), {
      wrapper: Wrapper,
    })

    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(500)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(toastError).toHaveBeenCalledWith(
      'No se pudo guardar. Intenta de nuevo.',
      expect.objectContaining({ color: 'red' }),
    )
  })
})

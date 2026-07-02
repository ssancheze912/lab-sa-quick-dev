import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { useCliente } from './useCliente'

function wrapper() {
  // retryDelay: 0 — useCliente sets its own retry (2 retries on non-404).
  // Zero delay keeps the tests deterministic without waiting for backoff.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useCliente', () => {
  it('resolves with the seed cliente on 200 (happy path)', async () => {
    const target = seedClientes[0]
    const { result } = renderHook(() => useCliente(target.id), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(target.id)
    expect(result.current.data?.nombre).toBe(target.nombre)
    expect(result.current.data?.nit).toBe(target.nit)
    expect(result.current.data?.telefono).toBe(target.telefono)
    expect(result.current.data?.ciudad).toBe(target.ciudad)
  })

  it('transitions to isError with status 404 when the backend returns 404', async () => {
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
            title: 'Cliente no encontrado',
            status: 404,
          },
          { status: 404 },
        ),
      ),
    )

    const { result } = renderHook(
      () => useCliente('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
      { wrapper: wrapper() },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(404)
  })

  it('transitions to isError with status 500 on server error (not 404)', async () => {
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useCliente(seedClientes[0].id), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.response?.status).toBe(500)
    expect(result.current.error?.response?.status).not.toBe(404)
  })

  it('stays pending and does not fetch when clienteId is undefined', async () => {
    let hits = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        hits += 1
        return HttpResponse.json(seedClientes[0])
      }),
    )

    const { result } = renderHook(() => useCliente(undefined), { wrapper: wrapper() })

    // Give the microtask queue a moment; disabled queries never leave pending.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(hits).toBe(0)
  })
})

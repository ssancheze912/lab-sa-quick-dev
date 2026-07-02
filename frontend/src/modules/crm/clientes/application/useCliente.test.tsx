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

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.2 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P1] does not fetch when clienteId is an empty string (enabled=false)', async () => {
    // GIVEN: An MSW handler counting hits — empty string must NOT trigger a call
    let hits = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        hits += 1
        return HttpResponse.json(seedClientes[0])
      }),
    )

    // WHEN: The hook is called with an empty string (Boolean('') === false → disabled)
    const { result } = renderHook(() => useCliente(''), { wrapper: wrapper() })

    // THEN: The query stays idle-pending and no HTTP call fires
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(hits).toBe(0)
  })

  it('[P1] scopes the cache by id via queryKey ["clientes", id] — two ids hit the network twice', async () => {
    // GIVEN: An MSW handler counting hits, one shared QueryClient for both hooks
    let hits = 0
    server.use(
      http.get('*/api/v1/clientes/:id', ({ params }) => {
        hits += 1
        const found = seedClientes.find((c) => c.id === params.id)
        return found
          ? HttpResponse.json(found)
          : HttpResponse.json({ status: 404 }, { status: 404 })
      }),
    )
    // A single shared QueryClient wraps both hook calls.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    })
    const sharedWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    // WHEN: Two separate ids are requested in sequence
    const first = renderHook(() => useCliente(seedClientes[0].id), {
      wrapper: sharedWrapper,
    })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))

    const second = renderHook(() => useCliente(seedClientes[1].id), {
      wrapper: sharedWrapper,
    })
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

    // THEN: The cache is scoped per id — the network was hit twice (one per id).
    // If the queryKey ignored the id, only one hit would have occurred.
    expect(hits).toBe(2)
    expect(first.result.current.data?.id).toBe(seedClientes[0].id)
    expect(second.result.current.data?.id).toBe(seedClientes[1].id)
  })

  it('[P2] does not retry on 404 — the error branch is reached after a single fetch', async () => {
    // GIVEN: A counter that fails with 404 on every request
    let hits = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        hits += 1
        return HttpResponse.json(
          { title: 'Cliente no encontrado', status: 404 },
          { status: 404 },
        )
      }),
    )

    // WHEN: The hook is invoked with an unknown id
    const { result } = renderHook(
      () => useCliente('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: The hook did NOT retry — exactly one HTTP call was made.
    // (The retry function returns `false` when error.response?.status === 404.)
    expect(hits).toBe(1)
    expect(result.current.error?.response?.status).toBe(404)
  })

  it('[P2] shares cached data across two hooks with the same id (no second fetch)', async () => {
    // GIVEN: A counter, a shared QueryClient, and the default MSW handler
    let hits = 0
    server.use(
      http.get('*/api/v1/clientes/:id', ({ params }) => {
        hits += 1
        const found = seedClientes.find((c) => c.id === params.id)
        return found
          ? HttpResponse.json(found)
          : HttpResponse.json({ status: 404 }, { status: 404 })
      }),
    )
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    })
    const sharedWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    // WHEN: Two hooks request the same id back-to-back (staleTime is 30s)
    const first = renderHook(() => useCliente(seedClientes[0].id), {
      wrapper: sharedWrapper,
    })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))

    const second = renderHook(() => useCliente(seedClientes[0].id), {
      wrapper: sharedWrapper,
    })
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

    // THEN: Only one network call happened — the second hook read from cache.
    expect(hits).toBe(1)
    expect(second.result.current.data?.id).toBe(seedClientes[0].id)
  })
})

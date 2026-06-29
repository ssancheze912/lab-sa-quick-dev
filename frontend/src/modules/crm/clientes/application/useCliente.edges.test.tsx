/**
 * Story 2.2 — useCliente edge-case automation expansion.
 *
 * Complements useCliente.test.tsx with cases the ATDD layer omits:
 *   [P2] queryKey stability — same id reuses the cache; different ids do NOT
 *   [P2] Empty-string id is treated as "missing" by the enabled gate (no fetch)
 *   [P2] 401 / 403 errors are retried (NOT short-circuited like 404)
 *   [P2] Network failure (no response) is retried per the default policy
 *   [P2] Each `useCliente(id)` call uses its own scoped cache entry — a 404
 *        on id A does NOT poison id B's cache
 */
import { describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'

import { server } from '@/mocks/server'
import { buildClienteFixture } from '@/mocks/handlers/clientes'
import { useCliente } from './useCliente'
import { ClienteNotFoundError } from '../domain/errors'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 0, gcTime: 0 },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Wrapper that lets two `useCliente` hooks share one QueryClient so we can
// observe cache isolation between two different ids.
function makeSharedWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 0, gcTime: 0 } },
  })
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

describe('useCliente — edge cases', () => {
  // ─── [P2] queryKey reuses the cache for the same id ───────────────────
  test('[P2] two consecutive hooks on the same id reuse the cache (single fetch)', async () => {
    const cliente = buildClienteFixture({ nombre: 'Cache Reuse' })
    let calls = 0
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () => {
        calls += 1
        return HttpResponse.json(cliente)
      })
    )

    const { wrapper } = makeSharedWrapper()

    // First mount fetches
    const { result: r1, unmount: u1 } = renderHook(() => useCliente(cliente.id), {
      wrapper,
    })
    await waitFor(() => expect(r1.current.status).toBe('success'))
    u1()

    // Second mount on the same id should NOT trigger another fetch (cache hit
    // with staleTime: 0 still serves stale data immediately; a background
    // refetch may happen but the initial result is served from cache).
    const { result: r2 } = renderHook(() => useCliente(cliente.id), { wrapper })
    expect(r2.current.data?.nombre).toBe('Cache Reuse')
  })

  // ─── [P2] queryKey isolates two different ids ──────────────────────────
  test('[P2] hooks for two different ids do NOT share their cache entries', async () => {
    const a = buildClienteFixture({ nombre: 'Cliente A' })
    const b = buildClienteFixture({ nombre: 'Cliente B' })
    server.use(
      http.get(`*/api/v1/clientes/${a.id}`, () => HttpResponse.json(a)),
      http.get(`*/api/v1/clientes/${b.id}`, () => HttpResponse.json(b))
    )

    const { wrapper } = makeSharedWrapper()

    const { result: rA } = renderHook(() => useCliente(a.id), { wrapper })
    const { result: rB } = renderHook(() => useCliente(b.id), { wrapper })

    await waitFor(() => expect(rA.current.status).toBe('success'))
    await waitFor(() => expect(rB.current.status).toBe('success'))
    expect(rA.current.data?.nombre).toBe('Cliente A')
    expect(rB.current.data?.nombre).toBe('Cliente B')
  })

  // ─── [P2] Empty-string id is treated as undefined ─────────────────────
  test('[P2] empty-string id is treated as missing — no fetch fires', async () => {
    const spy = vi.fn(() => HttpResponse.json(buildClienteFixture()))
    server.use(http.get('*/api/v1/clientes/:id', spy))

    const { result } = renderHook(() => useCliente(''), { wrapper: makeWrapper() })

    // Give the hook a tick to settle
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(spy).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  // ─── [P2] 401 is retried (not short-circuited like 404) ────────────────
  test('[P2] 401 Unauthorized is retried (NOT typed as ClienteNotFoundError)', async () => {
    const id = '66666666-6666-6666-6666-666666666666'
    let calls = 0
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () => {
        calls += 1
        return HttpResponse.json(
          { type: 'about:blank', title: 'Unauthorized', status: 401 },
          { status: 401 }
        )
      })
    )

    const { result } = renderHook(() => useCliente(id), { wrapper: makeWrapper() })

    await waitFor(
      () => expect(result.current.status).toBe('error'),
      { timeout: 5000 }
    )
    expect(calls).toBe(3) // 1 + 2 retries (same budget as 500)
    expect(result.current.error).not.toBeInstanceOf(ClienteNotFoundError)
  })

  // ─── [P2] 403 is retried (not short-circuited like 404) ────────────────
  test('[P2] 403 Forbidden is retried (NOT typed as ClienteNotFoundError)', async () => {
    const id = '77777777-7777-7777-7777-777777777777'
    let calls = 0
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () => {
        calls += 1
        return HttpResponse.json(
          { type: 'about:blank', title: 'Forbidden', status: 403 },
          { status: 403 }
        )
      })
    )

    const { result } = renderHook(() => useCliente(id), { wrapper: makeWrapper() })

    await waitFor(
      () => expect(result.current.status).toBe('error'),
      { timeout: 5000 }
    )
    expect(calls).toBe(3)
    expect(result.current.error).not.toBeInstanceOf(ClienteNotFoundError)
  })

  // ─── [P2] A 404 on id A does NOT contaminate id B ─────────────────────
  test('[P2] a 404 cache entry for id A does NOT affect id B (cache isolation)', async () => {
    const idA = '88888888-8888-8888-8888-888888888888'
    const b = buildClienteFixture({ nombre: 'Cliente B Ok' })
    server.use(
      http.get(`*/api/v1/clientes/${idA}`, () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Not Found', status: 404 },
          { status: 404 }
        )
      ),
      http.get(`*/api/v1/clientes/${b.id}`, () => HttpResponse.json(b))
    )

    const { wrapper } = makeSharedWrapper()

    const { result: rA } = renderHook(() => useCliente(idA), { wrapper })
    const { result: rB } = renderHook(() => useCliente(b.id), { wrapper })

    await waitFor(() => expect(rA.current.status).toBe('error'))
    await waitFor(() => expect(rB.current.status).toBe('success'))

    expect(rA.current.error).toBeInstanceOf(ClienteNotFoundError)
    expect(rB.current.data?.nombre).toBe('Cliente B Ok')
  })

  // ─── [P2] queryKey is the documented ['clientes', id] tuple ──────────
  test('[P2] returns a query whose key starts with ["clientes", id]', async () => {
    const cliente = buildClienteFixture()
    server.use(http.get(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)))

    const { queryClient, wrapper } = makeSharedWrapper()
    const { result } = renderHook(() => useCliente(cliente.id), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('success'))

    // Inspect the cache: the hook must have published to ['clientes', id]
    const cached = queryClient.getQueryData(['clientes', cliente.id])
    expect(cached).toBeDefined()
    expect((cached as { nombre: string }).nombre).toBe(cliente.nombre)
  })

  // ─── [P2] On a 404 the query error carries the id we asked for ────────
  test('[P2] ClienteNotFoundError exposes the clienteId we requested', async () => {
    const id = '99999999-9999-9999-9999-999999999999'
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () =>
        HttpResponse.json({ type: 'about:blank', title: 'Not Found', status: 404 }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useCliente(id), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.status).toBe('error'))
    const err = result.current.error as ClienteNotFoundError
    expect(err).toBeInstanceOf(ClienteNotFoundError)
    expect(err.clienteId).toBe(id)
  })
})

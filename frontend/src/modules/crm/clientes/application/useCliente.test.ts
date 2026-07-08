/**
 * Story 2.2 — ATDD (RED phase).
 *
 * Covers the `useCliente(id)` hook contract from Task 4:
 *   - AC #2 — happy path: hook resolves with data when the backend returns 200.
 *   - AC #4 — non-UUID id short-circuits the query (no network request fires).
 *   - AC #3 — 404 is a terminal state (NO retries — the "not-found" branch
 *             must render immediately).
 *   - AC #8 — the id is passed through verbatim to the API path segment.
 *
 * RED until the following files exist:
 *   - src/modules/crm/clientes/application/useCliente.ts
 *     (exports `useCliente` and the `isValidClienteId` guard + `clienteQueryKey`)
 */
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'
import { clienteQueryKey, isValidClienteId, useCliente } from './useCliente'

/**
 * Build a QueryClient with retries disabled at the client level so failing
 * queries do not retry three times by default and slow the test suite. The
 * hook itself SHOULD also disable retries for 404 via its `retry` predicate;
 * we assert that behaviour separately below.
 */
function wrapperFactory() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        staleTime: 0,
      },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

describe('clienteQueryKey', () => {
  it('GIVEN an id, THEN the canonical key is the ["clientes", id] tuple', () => {
    const id = '00000000-0000-0000-0000-000000000001'
    expect(clienteQueryKey(id)).toEqual(['clientes', id])
  })
})

describe('isValidClienteId', () => {
  it('GIVEN a well-formed UUID v4, THEN returns true', () => {
    expect(isValidClienteId('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')).toBe(true)
  })

  it('GIVEN a non-UUID string, THEN returns false', () => {
    expect(isValidClienteId('abc123')).toBe(false)
  })

  it('GIVEN undefined, THEN returns false', () => {
    expect(isValidClienteId(undefined)).toBe(false)
  })

  it('GIVEN an empty string, THEN returns false', () => {
    expect(isValidClienteId('')).toBe(false)
  })
})

describe('useCliente hook — happy path (AC #2, #8)', () => {
  it('GIVEN the backend returns 200 with a Cliente, WHEN the hook resolves, THEN data === the returned Cliente', async () => {
    const fixture = buildCliente({ nombre: 'Empresa Detalle' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(fixture, { status: 200 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCliente(fixture.id), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixture)
  })

  it('GIVEN a UUID id, THEN it is passed through verbatim into the URL path segment', async () => {
    const fixture = buildCliente()
    let observedPath = ''
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, ({ params }) => {
        observedPath = String(params.id)
        return HttpResponse.json(fixture, { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCliente(fixture.id), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(observedPath).toBe(fixture.id)
  })
})

describe('useCliente hook — invalid UUID short-circuit (AC #4)', () => {
  it('GIVEN a non-UUID id, THEN the query is DISABLED (no request fires, isLoading is false)', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCliente('abc'), { wrapper })

    // Give any accidental fetch a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(calls).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('GIVEN undefined id, THEN the query is DISABLED (no request fires)', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    renderHook(() => useCliente(undefined), { wrapper })
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(calls).toBe(0)
  })
})

describe('useCliente hook — 404 terminal state (AC #3)', () => {
  it('GIVEN the backend returns 404, THEN isError is true AND the request was NOT retried', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return new HttpResponse(null, { status: 404 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const id = 'a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77'
    const { result } = renderHook(() => useCliente(id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // The hook's retry predicate MUST return false for 404 to keep the not-found
    // branch fast (AC #3 UX contract — no 1.5 s wait for the default 3 retries).
    expect(calls).toBe(1)
  })
})

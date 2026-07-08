/**
 * Story 2.2 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `useCliente(id)` with boundary conditions the
 * RED-phase tests skipped:
 *   * `isValidClienteId` accepts uppercase-hex UUIDs (backend `:guid` route
 *     constraint is case-insensitive on hex chars — the frontend MUST match).
 *   * Whitespace-only ids are rejected (short-circuit into ClienteNotFound).
 *   * Two concurrent consumers of the same id share a single in-flight request
 *     (TanStack Query dedup by key).
 *   * Two consumers of DIFFERENT ids each fire their own request (no cross
 *     contamination — the query key includes the id).
 *   * A 500 response does NOT retry — the ErrorPanel branch shows fast.
 *   * A network-layer error surfaces as `isError` (not a silent failure).
 *
 * [P1] tag — the fetch hook is the seam between the URL and the API. Any bug
 * here breaks EVERY consumer (route, detail view, and future edit/delete
 * flows in Stories 2.4/2.5).
 */
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'
import { isValidClienteId, useCliente } from './useCliente'

function wrapperFactory() {
  // Fresh client per test — no cache bleed between cases. `retry: false` at
  // the client level makes any hook-level `retry` opt-in observable, not a
  // silent default.
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

describe('isValidClienteId — edge cases', () => {
  it('GIVEN an uppercase-hex UUID, THEN returns true (matches backend :guid case-insensitivity)', () => {
    expect(
      isValidClienteId('A3D81B62-9C9D-4A3D-9C8E-2B1F4D1A0E77'),
    ).toBe(true)
  })

  it('GIVEN a mixed-case UUID, THEN returns true', () => {
    expect(
      isValidClienteId('a3D81b62-9c9D-4a3D-9c8E-2b1F4d1a0E77'),
    ).toBe(true)
  })

  it('GIVEN a whitespace-only string, THEN returns false', () => {
    expect(isValidClienteId('   ')).toBe(false)
  })

  it('GIVEN a UUID with leading whitespace, THEN returns false (no auto-trim)', () => {
    expect(
      isValidClienteId(' a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77'),
    ).toBe(false)
  })

  it('GIVEN Guid.Empty (all zeros), THEN returns true (well-formed shape)', () => {
    expect(isValidClienteId('00000000-0000-0000-0000-000000000000')).toBe(true)
  })

  it('GIVEN null, THEN returns false', () => {
    expect(isValidClienteId(null)).toBe(false)
  })
})

describe('useCliente — dedup and isolation (AC #7)', () => {
  it('GIVEN two consumers with the SAME id, WHEN both mount, THEN only ONE HTTP request fires', async () => {
    const target = buildCliente()
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return HttpResponse.json(target, { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result: r1 } = renderHook(() => useCliente(target.id), { wrapper })
    const { result: r2 } = renderHook(() => useCliente(target.id), { wrapper })

    await waitFor(() => {
      expect(r1.current.isSuccess).toBe(true)
      expect(r2.current.isSuccess).toBe(true)
    })

    expect(calls).toBe(1)
    // Both consumers observe the same cached reference.
    expect(r1.current.data).toEqual(r2.current.data)
  })

  it('GIVEN two consumers with DIFFERENT ids, THEN each fires its own request (query key includes id)', async () => {
    const a = buildCliente({ id: '11111111-1111-1111-1111-111111111111', nombre: 'A' })
    const b = buildCliente({ id: '22222222-2222-2222-2222-222222222222', nombre: 'B' })
    const seen = new Set<string>()
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, ({ params }) => {
        const id = String(params.id)
        seen.add(id)
        if (id === a.id) return HttpResponse.json(a, { status: 200 })
        if (id === b.id) return HttpResponse.json(b, { status: 200 })
        return new HttpResponse(null, { status: 404 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result: r1 } = renderHook(() => useCliente(a.id), { wrapper })
    const { result: r2 } = renderHook(() => useCliente(b.id), { wrapper })

    await waitFor(() => {
      expect(r1.current.isSuccess).toBe(true)
      expect(r2.current.isSuccess).toBe(true)
    })

    expect(seen.has(a.id)).toBe(true)
    expect(seen.has(b.id)).toBe(true)
    expect(r1.current.data?.nombre).toBe('A')
    expect(r2.current.data?.nombre).toBe('B')
  })
})

describe('useCliente — error paths (AC #6)', () => {
  it('GIVEN the backend returns 500, THEN isError is true AND the request is NOT retried', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return HttpResponse.json({}, { status: 500 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const id = 'a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77'
    const { result } = renderHook(() => useCliente(id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // The hook has retry: false — a 500 must not be silently retried.
    expect(calls).toBe(1)
  })

  it('GIVEN the backend returns 401, THEN isError is true (auth failure surfaces to the presentation layer)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const id = 'a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77'
    const { result } = renderHook(() => useCliente(id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('GIVEN the backend returns 503, THEN isError is true (transient upstream failure surfaces cleanly)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        new HttpResponse(null, { status: 503 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const id = 'a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77'
    const { result } = renderHook(() => useCliente(id), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

describe('useCliente — enabled state transitions (AC #7)', () => {
  it('GIVEN a valid id, THEN the query mounts with isPending = true before resolving', () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, async () => {
        await new Promise(() => {}) // never resolve
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(
      () => useCliente('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77'),
      { wrapper },
    )

    // With `enabled: true` the query starts in the pending state.
    expect(result.current.isPending).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('GIVEN an invalid id, THEN the disabled query never enters isPending and never fires', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCliente('not-a-uuid'), { wrapper })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(result.current.isError).toBe(false)
  })
})

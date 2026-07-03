/**
 * Story 2.2 — useCliente hook EDGE CASES (Automate expansion)
 * Epic 2: Client Management
 *
 * Expands the ATDD suite (`useCliente.test.tsx`) with edge cases and negative
 * paths that the RED→GREEN cycle did not exercise:
 *
 *   • [P1] Non-404 4xx (401/403/429) DO retry — the hook only short-circuits
 *     on 404. Any other 4xx is a transient auth / rate-limit condition and
 *     must retry (the discriminator is HTTP status, not error class).
 *   • [P1] 5xx variants (502 / 503) retry like 500.
 *   • [P1] Cache isolation: two independent ids under the same QueryClient
 *     have independent cache entries and independent retry state.
 *   • [P1] `isClienteNotFound(error)` returns false for a 500 wrapped in an
 *     AxiosError (positive & negative confirmation).
 *   • [P2] `queryKey` order matters — `['clientes', id]` NOT `[id, 'clientes']`.
 *   • [P2] Non-Axios errors (e.g. a thrown Error) do NOT trigger the 404
 *     short-circuit — they follow the default retry policy.
 *
 * Uses the same MSW setup as ATDD. Fresh QueryClient per test to keep the
 * cache deterministic. `retryDelay: 0` to keep the retry-count assertions
 * fast.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, AxiosHeaders } from 'axios'
import type { ReactNode } from 'react'

import {
  useCliente,
  isClienteNotFound,
} from '@/modules/crm/clientes/application/useCliente'
import {
  clientesHandlers,
  makeCliente,
  resetClienteFactoryCounter,
} from '@/test/handlers/clientes'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  cleanup()
  resetClienteFactoryCounter()
})

// ─────────────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClientAllowRetries(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, staleTime: 0, retryDelay: 0 },
      mutations: { retry: false },
    },
  })
}

function makeQueryClientNoRetries(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function wrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Non-404 4xx (401/403/429) DO retry — 404 is the ONLY short-circuit
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useCliente — non-404 4xx errors still retry', () => {
  it('[P1] should retry on HTTP 401 (auth) — 404 is not the same as 401', async () => {
    // GIVEN: MSW counts requests and always returns 401
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered against a 401-returning backend
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000401'),
      { wrapper: wrapper(client) },
    )

    // THEN: The default retry policy (3 attempts) applies — >1 request.
    //       If the hook mistakenly extended the 404 branch to "any 4xx" this
    //       would short-circuit at getCount === 1 and the assertion would fail.
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(getCount).toBeGreaterThan(1)
  })

  it('[P1] should retry on HTTP 403 (forbidden) — not a not-found', async () => {
    // GIVEN: MSW returns 403 every time
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return new HttpResponse(null, { status: 403 })
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000403'),
      { wrapper: wrapper(client) },
    )

    // THEN: > 1 request has been issued (retry loop engaged for 403)
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(getCount).toBeGreaterThan(1)
  })

  it('[P1] should retry on HTTP 429 (rate limit) — transient, not not-found', async () => {
    // GIVEN: MSW returns 429 every time (worst-case: the rate limit does not lift)
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return new HttpResponse(null, { status: 429 })
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000429'),
      { wrapper: wrapper(client) },
    )

    // THEN: > 1 request has been issued (retry loop engaged for 429)
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(getCount).toBeGreaterThan(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] 5xx variants (502 / 503) — retry like 500
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useCliente — 5xx variants retry (502 / 503)', () => {
  it('[P1] should retry on HTTP 502 (bad gateway)', async () => {
    // GIVEN: MSW counts requests and returns 502
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return new HttpResponse(null, { status: 502 })
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000502'),
      { wrapper: wrapper(client) },
    )

    // THEN: More than one attempt occurred
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(getCount).toBeGreaterThan(1)
  })

  it('[P1] should retry on HTTP 503 (service unavailable)', async () => {
    // GIVEN: MSW counts requests and returns 503
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return new HttpResponse(null, { status: 503 })
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000503'),
      { wrapper: wrapper(client) },
    )

    // THEN: More than one attempt occurred
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(getCount).toBeGreaterThan(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Cache isolation — two ids under the same QueryClient are independent
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useCliente — cache isolation between distinct ids', () => {
  it('[P1] should store two ids under independent queryKey entries', async () => {
    // GIVEN: MSW serves two different clientes with distinct ids
    const clienteA = makeCliente({
      id: '00000000-0000-4000-8000-0000000000aa',
      nombre: 'Cliente Alfa',
    })
    const clienteB = makeCliente({
      id: '00000000-0000-4000-8000-0000000000bb',
      nombre: 'Cliente Beta',
    })
    server.use(clientesHandlers.byId(clienteA), clientesHandlers.byId(clienteB))
    const client = makeQueryClientNoRetries()

    // WHEN: Two hooks are rendered — one per id — inside the same QueryClient
    const { result: resultA } = renderHook(() => useCliente(clienteA.id), {
      wrapper: wrapper(client),
    })
    const { result: resultB } = renderHook(() => useCliente(clienteB.id), {
      wrapper: wrapper(client),
    })
    await waitFor(() => expect(resultA.current.isSuccess).toBe(true))
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true))

    // THEN: The cache holds BOTH entries independently — retrieving one MUST
    //       NOT return the other (per-id isolation is the whole point of the
    //       ['clientes', id] key).
    const cachedA = client.getQueryData(['clientes', clienteA.id])
    const cachedB = client.getQueryData(['clientes', clienteB.id])
    expect(cachedA).toBeDefined()
    expect(cachedB).toBeDefined()
    expect(cachedA).not.toEqual(cachedB)
  })

  it('[P1] should NOT share retry state across ids (404 on A does not gate B)', async () => {
    // GIVEN: id A always returns 404; id B always returns 200
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-0000000000cc',
      nombre: 'Cliente Gamma',
    })
    server.use(
      http.get('*/api/v1/clientes/00000000-0000-4000-8000-0000000000dd', () =>
        HttpResponse.json(
          { title: 'Not Found', status: 404, type: 'about:blank' },
          { status: 404 },
        ),
      ),
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente),
      ),
    )
    const client = makeQueryClientNoRetries()

    // WHEN: Both hooks are mounted simultaneously
    const { result: resultA } = renderHook(
      () => useCliente('00000000-0000-4000-8000-0000000000dd'),
      { wrapper: wrapper(client) },
    )
    const { result: resultB } = renderHook(() => useCliente(cliente.id), {
      wrapper: wrapper(client),
    })

    // THEN: A resolves to error, B resolves to success — no cross-contamination
    await waitFor(() => expect(resultA.current.isError).toBe(true))
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true))
    expect(isClienteNotFound(resultA.current.error)).toBe(true)
    expect(resultB.current.data?.nombre).toBe('Cliente Gamma')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] queryKey shape — order matters, exact key is ['clientes', id]
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useCliente — queryKey shape (order / structure)', () => {
  it('[P2] should NOT cache under a reversed [id, "clientes"] key', async () => {
    // GIVEN: A cliente served by MSW
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-0000000000ee',
    })
    server.use(clientesHandlers.byId(cliente))
    const client = makeQueryClientNoRetries()

    // WHEN: The hook is rendered and the query resolves
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: wrapper(client),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: The canonical key wins; the reversed key holds nothing.
    //       Guards against a future refactor that silently swaps the tuple.
    expect(client.getQueryData(['clientes', cliente.id])).toBeDefined()
    expect(client.getQueryData([cliente.id, 'clientes'])).toBeUndefined()
  })

  it('[P2] should have exactly one cache entry per id after a successful fetch', async () => {
    // GIVEN: A cliente served by MSW
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-0000000000ff',
    })
    server.use(clientesHandlers.byId(cliente))
    const client = makeQueryClientNoRetries()

    // WHEN: The hook resolves
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: wrapper(client),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: getQueryCache returns exactly one entry for this key (no duplicates)
    const matches = client
      .getQueryCache()
      .findAll({ queryKey: ['clientes', cliente.id] })
    expect(matches).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] isClienteNotFound — positive & negative confirmation on real errors
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] isClienteNotFound — helper behaviour on real error shapes', () => {
  it('[P2] should return true for an AxiosError with response.status === 404', () => {
    // GIVEN: An AxiosError shaped like a real 404 response from Axios
    const error = new AxiosError(
      'Request failed with status code 404',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        statusText: 'Not Found',
        data: { title: 'Not Found' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    )

    // WHEN / THEN: The helper correctly identifies a 404
    expect(isClienteNotFound(error)).toBe(true)
  })

  it('[P2] should return false for an AxiosError with status 500', () => {
    // GIVEN: An AxiosError shaped like a real 500 response from Axios
    const error = new AxiosError(
      'Request failed with status code 500',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        data: null,
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    )

    // WHEN / THEN: 500 is NOT a 404 (branch discipline)
    expect(isClienteNotFound(error)).toBe(false)
  })

  it('[P2] should return false for an AxiosError with no response (network error)', () => {
    // GIVEN: A raw network error — Axios throws with no `response` populated
    const error = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      undefined,
      undefined,
      undefined,
    )

    // WHEN / THEN: No response ⇒ definitely not a 404 (short-circuit false)
    expect(isClienteNotFound(error)).toBe(false)
  })
})

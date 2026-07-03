/**
 * Story 2.2 — Client Detail View — Hook ATDD (RED phase)
 * Epic 2: Client Management
 *
 * Direct hook-level unit tests that validate the TanStack Query contract for
 * `useCliente(clienteId)` and the `isClienteNotFound(error)` helper:
 *
 *   • Canonical `queryKey: ['clientes', id]` per architecture.md#TanStack Query keys
 *   • Retries are DISABLED on HTTP 404 (single request; not-found resolves fast)
 *   • Retries ARE enabled on non-404 errors (500, network) — verified by request count
 *   • `isClienteNotFound(error)` correctly discriminates 404 from other errors
 *
 * Test cases covered:
 *   TC-E2-P1-05 (hook contract underneath the not-found UI branch)
 *   AC #8 — queryKey, staleTime, retry disabled on 404
 *
 * These tests will fail until Task 7 creates
 * `frontend/src/modules/crm/clientes/application/useCliente.ts`
 * exporting both `useCliente` and `isClienteNotFound`.
 *
 * Given-When-Then structure. Network-first (MSW handlers configured before
 * `renderHook`). Selectors are irrelevant — hook-level test.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
// MSW server — network-first: handlers are set BEFORE renderHook
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
  // Note: the harness deliberately does NOT override `retry` — we want the
  // hook's own `retry` predicate to be exercised here.
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
// AC #8 — canonical queryKey ['clientes', id]
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — canonical queryKey ["clientes", id]', () => {
  it('should cache the fetched cliente under queryKey ["clientes", id]', async () => {
    // GIVEN: MSW serves a cliente with a known id
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000042',
      nombre: 'Cliente Cache Key',
    })
    server.use(clientesHandlers.byId(cliente))
    const client = makeQueryClientNoRetries()

    // WHEN: The hook is rendered and the query resolves
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: wrapper(client),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: The QueryClient has cached the cliente under the canonical key
    const cached = client.getQueryData(['clientes', cliente.id])
    expect(cached).toBeDefined()
    const entry = client
      .getQueryCache()
      .find({ queryKey: ['clientes', cliente.id] })
    expect(entry).toBeDefined()
  })

  it('should resolve with the cliente returned by the repository', async () => {
    // GIVEN: MSW serves a known cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000000010',
      nombre: 'Corporación X',
      nitRuc: '900987654-3',
      telefono: '3200000000',
      ciudad: 'Cali',
    })
    server.use(clientesHandlers.byId(cliente))
    const client = makeQueryClientNoRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: wrapper(client),
    })

    // THEN: `data` eventually equals the cliente from the network
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(cliente.id)
    expect(result.current.data?.nombre).toBe('Corporación X')
    expect(result.current.data?.nitRuc).toBe('900987654-3')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #8 — retries DISABLED on 404 (fast not-found resolution)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — retry disabled on HTTP 404 (fast not-found)', () => {
  it('should NOT retry the request when the API returns 404', async () => {
    // GIVEN: An MSW handler that counts requests and always returns 404
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return HttpResponse.json(
          { title: 'Not Found', status: 404, type: 'about:blank' },
          { status: 404 },
        )
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered with any id
    const { result } = renderHook(
      () => useCliente('00000000-0000-0000-0000-000000000000'),
      { wrapper: wrapper(client) },
    )

    // THEN: The query resolves to error state after exactly ONE request.
    // TanStack Query's default retry (3) would produce 4 requests — the
    // hook's predicate MUST short-circuit at 1.
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getCount).toBe(1)
  })

  it('should mark isClienteNotFound(error) === true on a 404 response', async () => {
    // GIVEN: MSW returns a 404 Problem Details body for any id
    server.use(clientesHandlers.byIdNotFound())
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-0000-0000-000000000000'),
      { wrapper: wrapper(client) },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: The exported helper correctly identifies the 404
    expect(isClienteNotFound(result.current.error)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #8 — non-404 errors DO retry (network / 5xx path is distinct from 404)
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — non-404 errors are retried', () => {
  it('should retry more than once when the API returns 500', async () => {
    // GIVEN: MSW counts requests and always returns 500
    let getCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        getCount += 1
        return new HttpResponse(null, { status: 500 })
      }),
    )
    const client = makeQueryClientAllowRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000001'),
      { wrapper: wrapper(client) },
    )

    // THEN: After the error state settles, > 1 request has been issued —
    // proving that the 500 branch does NOT short-circuit like 404 does.
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(getCount).toBeGreaterThan(1)
  })

  it('should mark isClienteNotFound(error) === false on a non-404 response', async () => {
    // GIVEN: MSW returns a 500 for any id
    server.use(clientesHandlers.byIdError(500))
    const client = makeQueryClientNoRetries()

    // WHEN: The hook is rendered
    const { result } = renderHook(
      () => useCliente('00000000-0000-4000-8000-000000000002'),
      { wrapper: wrapper(client) },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: The exported helper correctly excludes the 500 from the 404 branch
    expect(isClienteNotFound(result.current.error)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #8 — isClienteNotFound helper — pure function contract
// ─────────────────────────────────────────────────────────────────────────────

describe('isClienteNotFound — helper predicate', () => {
  it('should return false for undefined / null / string errors', () => {
    // GIVEN / WHEN / THEN: Non-Axios values never match the 404 predicate
    expect(isClienteNotFound(undefined)).toBe(false)
    expect(isClienteNotFound(null)).toBe(false)
    expect(isClienteNotFound('some error')).toBe(false)
    expect(isClienteNotFound(new Error('nope'))).toBe(false)
  })
})

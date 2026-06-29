/**
 * Story 2.2 — useCliente TanStack Query hook ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #5 — queryKey ['clientes', id], settles to success with ClienteDto on 200
 *   AC #6 — settles to error whose error instanceof ClienteNotFoundError on 404
 *   AC #6 — does NOT retry on 404 (controlled state — handler hit exactly once)
 *   AC #8 — retries up to 2 times on 500 (3 total handler hits)
 *
 * MUST fail until application/useCliente.ts + domain/errors.ts + the
 * per-id MSW handlers are implemented.
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

describe('useCliente — Story 2.2 ATDD', () => {
  // ─── AC #5 — success path ────────────────────────────────────────────
  test('AC #5 — settles to success with the dto on 200', async () => {
    // GIVEN: per-id endpoint returns a known dto
    const cliente = buildClienteFixture({ nombre: 'Hook Success' })
    server.use(http.get(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)))

    // WHEN: useCliente is invoked with the id
    const { result } = renderHook(() => useCliente(cliente.id), {
      wrapper: makeWrapper(),
    })

    // THEN: it eventually reaches success with the matching dto
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.data).toMatchObject({
      id: cliente.id,
      nombre: 'Hook Success',
    })
  })

  // ─── AC #6 — 404 → ClienteNotFoundError, NO retry ────────────────────
  test('AC #6 — settles to error whose error instanceof ClienteNotFoundError on 404, without retrying', async () => {
    // GIVEN: per-id endpoint returns 404, counter on the handler
    const id = '00000000-0000-0000-0000-000000000000'
    let calls = 0
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () => {
        calls += 1
        return HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
            title: 'Cliente no encontrado',
            status: 404,
            instance: `/api/v1/clientes/${id}`,
            detail: null,
          },
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
        )
      })
    )

    // WHEN: useCliente is invoked
    const { result } = renderHook(() => useCliente(id), { wrapper: makeWrapper() })

    // THEN: it settles to error with the typed error class, and the handler was hit exactly once
    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBeInstanceOf(ClienteNotFoundError)
    expect(calls).toBe(1)
  })

  // ─── AC #8 — 500 → retries twice (3 total hits) ──────────────────────
  test('AC #8 — retries up to 2 times on 500 (3 total handler hits)', async () => {
    // GIVEN: per-id endpoint always returns 500, counter on the handler
    const id = '11111111-1111-1111-1111-111111111111'
    let calls = 0
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () => {
        calls += 1
        return HttpResponse.json(
          { type: 'about:blank', title: 'Server Error', status: 500 },
          { status: 500 }
        )
      })
    )

    // WHEN: useCliente is invoked
    const { result } = renderHook(() => useCliente(id), { wrapper: makeWrapper() })

    // THEN: it settles to error after 1 initial + 2 retries = 3 total hits
    await waitFor(
      () => {
        expect(result.current.status).toBe('error')
      },
      { timeout: 5000 }
    )
    expect(calls).toBe(3)
    expect(result.current.error).not.toBeInstanceOf(ClienteNotFoundError)
  })

  // ─── AC #5 — disabled when id is undefined ───────────────────────────
  test('AC #5 — does NOT fire any request when id is undefined (enabled gate)', async () => {
    // GIVEN: spy on any per-id call
    const spy = vi.fn(() => HttpResponse.json(buildClienteFixture()))
    server.use(http.get('*/api/v1/clientes/:id', spy))

    // WHEN: useCliente is invoked with undefined
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: makeWrapper(),
    })

    // THEN: it stays pending (or disabled) and the endpoint was never called
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(spy).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })
})

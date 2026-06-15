/**
 * Story 2.5 — hook-level tests for `useDeleteCliente`.
 *
 * Verifies:
 *   - Successful DELETE invalidates `['clientes']` AND removes `['clientes', id]`.
 *   - `contactosOrphaned` defaults to 0 when the header is absent.
 *   - `contactosOrphaned` reads the integer from the `X-Contactos-Orphaned` header.
 *   - 404 + 500 propagate as axios errors with status codes the consumer can branch on.
 */

import { describe, expect, test, beforeAll, afterEach, afterAll, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDeleteCliente } from '../useDeleteCliente'

const CLIENTE_ID = '00000000-0000-0000-0000-000000000123'

const server = setupServer(
  http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function buildClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function buildWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useDeleteCliente — Story 2.5', () => {
  test('invalidates_list_and_removes_single_cache_on_success', async () => {
    const client = buildClient()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const removeSpy = vi.spyOn(client, 'removeQueries')

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: buildWrapper(client),
    })

    result.current.mutate({ id: CLIENTE_ID })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['clientes', CLIENTE_ID] })
  })

  test('returns_contactos_orphaned_zero_when_header_absent', async () => {
    const client = buildClient()
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: buildWrapper(client),
    })

    result.current.mutate({ id: CLIENTE_ID })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.contactosOrphaned).toBe(0)
  })

  test('returns_contactos_orphaned_count_when_header_present', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(null, {
          status: 204,
          headers: { 'X-Contactos-Orphaned': '3' },
        }),
      ),
    )

    const client = buildClient()
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: buildWrapper(client),
    })

    result.current.mutate({ id: CLIENTE_ID })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.contactosOrphaned).toBe(3)
  })

  test('propagates_404_as_axios_error_with_status_404', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(
          JSON.stringify({
            status: 404,
            title: 'Cliente no encontrado.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const client = buildClient()
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: buildWrapper(client),
    })

    result.current.mutate({ id: CLIENTE_ID })
    await waitFor(() => expect(result.current.isError).toBe(true))

    const err = result.current.error as { response?: { status?: number } } | null
    expect(err).not.toBeNull()
    expect(err?.response?.status).toBe(404)
  })

  test('propagates_500_as_axios_error_with_status_500', async () => {
    server.use(
      http.delete(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const client = buildClient()
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: buildWrapper(client),
    })

    result.current.mutate({ id: CLIENTE_ID })
    await waitFor(() => expect(result.current.isError).toBe(true))

    const err = result.current.error as { response?: { status?: number } } | null
    expect(err).not.toBeNull()
    expect(err?.response?.status).toBe(500)
  })
})

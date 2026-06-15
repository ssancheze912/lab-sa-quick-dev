/**
 * Story 2.4 — hook-level tests for `useUpdateCliente`.
 *
 * Verifies:
 *   - Successful PUT invalidates BOTH `['clientes']` and `['clientes', id]`.
 *   - A 409 response propagates as an axios error the form can branch on.
 */

import { describe, expect, test, beforeAll, afterEach, afterAll, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpdateCliente } from '../useUpdateCliente'

const CLIENTE_ID = '00000000-0000-0000-0000-000000000123'

const UPDATED = {
  id: CLIENTE_ID,
  nombre: 'Acme Editado',
  nit: '900.123.456-7',
  telefono: '+57 300 000 0000',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const server = setupServer(
  http.put(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
    HttpResponse.json(UPDATED, { status: 200 }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useUpdateCliente — Story 2.4', () => {
  test('invalidates_both_keys_on_success', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    })

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: CLIENTE_ID,
      input: {
        nombre: 'Acme Editado',
        nit: '900.123.456-7',
        telefono: '+57 300 000 0000',
        ciudad: 'Medellín',
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['clientes', CLIENTE_ID],
    })
  })

  test('propagates_error_for_409', async () => {
    server.use(
      http.put(`*/api/v1/clientes/${CLIENTE_ID}`, () =>
        new HttpResponse(
          JSON.stringify({
            status: 409,
            title: 'El NIT/RUC ya está registrado.',
          }),
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: CLIENTE_ID,
      input: {
        nombre: 'Acme',
        nit: '900.123.456-7',
        telefono: '+57 300 000 0000',
        ciudad: 'Medellín',
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // The error is an axios error so the form's onError handler can branch on
    // `axios.isAxiosError(err) && err.response?.status === 409`.
    const err = result.current.error as { response?: { status?: number } } | null
    expect(err).not.toBeNull()
    expect(err?.response?.status).toBe(409)
  })
})

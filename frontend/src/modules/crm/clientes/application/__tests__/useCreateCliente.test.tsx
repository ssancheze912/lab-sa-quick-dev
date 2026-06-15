/**
 * Story 2.3 — hook-level test for `useCreateCliente`.
 *
 * Verifies that the mutation invalidates the canonical `['clientes']` query
 * key on success (AC #3 / FR27).
 */

import { describe, expect, test, beforeAll, afterEach, afterAll, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateCliente } from '../useCreateCliente'

const CREATED = {
  id: '00000000-0000-0000-0000-000000000099',
  nombre: 'Acme S.A.S.',
  nit: '900.123.456-7',
  telefono: '+57 300 000 0000',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const server = setupServer(
  http.post('*/api/v1/clientes', () => HttpResponse.json(CREATED, { status: 201 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useCreateCliente — Story 2.3', () => {
  test('invalidates the [\'clientes\'] query key on success', async () => {
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

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    result.current.mutate({
      nombre: 'Acme S.A.S.',
      nit: '900.123.456-7',
      telefono: '+57 300 000 0000',
      ciudad: 'Medellín',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
  })
})

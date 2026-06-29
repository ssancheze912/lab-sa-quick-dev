/**
 * Story 2.1 — Client List & Search — useClientes ATDD (RED phase).
 *
 * Acceptance criterion covered:
 *   AC #2 / AC #6 — useClientes wraps GET /api/v1/clientes with TanStack Query
 *                   and exposes { data, status, error, refetch } for branching.
 *
 * MUST fail until modules/crm/clientes/application/useClientes.ts is created.
 */
import { describe, expect, test } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'

import { server } from '@/mocks/server'
import { buildClienteFixture, clienteHandlers, clienteHandlersError } from '@/mocks/handlers/clientes'
import { useClientes } from './useClientes'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useClientes — TanStack Query hook contract', () => {
  test('returns status=success and the fetched list on 200', async () => {
    // GIVEN: backend returns 2 clients
    server.use(
      ...clienteHandlers([
        buildClienteFixture({ nombre: 'A' }),
        buildClienteFixture({ nombre: 'B' }),
      ])
    )

    // WHEN: the hook runs
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: status reaches 'success' and data has 2 items
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.refetch).toBe('function')
  })

  test('returns status=error when the backend returns 500', async () => {
    // GIVEN: backend returns 500
    server.use(...clienteHandlersError())

    // WHEN: the hook runs
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })

    // THEN: status reaches 'error' with no data
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).not.toBeNull()
  })

  test('exposes refetch that re-runs the query', async () => {
    // GIVEN: first call returns 500, second call returns 1 client
    let calls = 0
    server.use(
      http.get('*/api/v1/clientes', () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json(
            { type: 'about:blank', title: 'Error', status: 500 },
            { status: 500 }
          )
        }
        return HttpResponse.json([buildClienteFixture({ nombre: 'Recovered' })])
      })
    )

    // WHEN: hook runs, reaches error, then refetch is invoked
    const { result } = renderHook(() => useClientes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.status).toBe('error'))
    await result.current.refetch()

    // THEN: status flips to 'success' with the recovered data
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]?.nombre).toBe('Recovered')
  })
})

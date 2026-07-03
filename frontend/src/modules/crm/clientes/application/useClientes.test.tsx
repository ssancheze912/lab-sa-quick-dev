/**
 * Story 2.1 — useClientes hook contract (Automate expansion)
 *
 * Direct hook-level unit tests that validate the TanStack Query contract:
 *
 *   • Canonical `queryKey: ['clientes']` per architecture.md#TanStack Query keys
 *   • Data is returned unchanged from the repository (no client-side reshaping)
 *   • Errors surface via `isError` (retries disabled at the QueryClient level)
 *
 * The ATDD suite covers these paths indirectly through `<ClienteListView>` but
 * a direct hook test provides a stable regression signal if the presentation
 * layer is later refactored to consume `useClientes` differently.
 *
 * Priority: P2 — hook contract regression.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { useClientes } from '@/modules/crm/clientes/application/useClientes'
import {
  clientesHandlers,
  makeCliente,
  resetClienteFactoryCounter,
} from '@/test/handlers/clientes'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  cleanup()
  resetClienteFactoryCounter()
})

function makeQueryClient(): QueryClient {
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

describe('[P2] useClientes — TanStack Query contract', () => {
  it('[P2] should resolve with the array returned by the repository', async () => {
    // GIVEN: MSW returns three clients
    const list = [
      makeCliente({ nombre: 'A' }),
      makeCliente({ nombre: 'B' }),
      makeCliente({ nombre: 'C' }),
    ]
    server.use(clientesHandlers.list(list))
    const client = makeQueryClient()

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: wrapper(client),
    })

    // THEN: `data` eventually equals the array from the network
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
    expect(result.current.data?.map((c) => c.nombre)).toEqual(['A', 'B', 'C'])
  })

  it('[P2] should use ["clientes"] as the canonical query key', async () => {
    // GIVEN: MSW returns one client
    server.use(clientesHandlers.list([makeCliente()]))
    const client = makeQueryClient()

    // WHEN: The hook is rendered and resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: wrapper(client),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: The QueryClient has cached data under the canonical key ['clientes']
    const cached = client.getQueryData(['clientes'])
    expect(cached).toBeDefined()
    expect(Array.isArray(cached)).toBe(true)
  })

  it('[P2] should expose isError=true when the request fails', async () => {
    // GIVEN: MSW returns a 500
    server.use(clientesHandlers.error(500))
    const client = makeQueryClient()

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: wrapper(client),
    })

    // THEN: The query eventually reports error state
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('[P2] should return an empty array when the API responds with []', async () => {
    // GIVEN: MSW returns an empty array
    server.use(clientesHandlers.empty())
    const client = makeQueryClient()

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: wrapper(client),
    })

    // THEN: `data` is the empty array (NOT undefined, NOT null)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

/**
 * Story 2.1: Client List & Search
 * Unit tests — useClientes application hook (RED phase)
 *
 * Verifies that `useClientes` returns the correct data shape when the
 * API responds successfully via MSW.
 *
 * AC covered: #1, #3, #4
 *
 * STATUS: RED — `useClientes.ts` does not exist yet.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '1',
    nombre: 'Cliente A',
    nit: '900111222',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'Cliente B',
    nit: '900333444',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MSW server (network-first — intercept before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('http://localhost:5000/api/v1/clientes', () =>
    HttpResponse.json(mockClientes)
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test wrapper
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useClientes — happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes hook', () => {
  it('should return an array of clients when the API responds with 2 items', async () => {
    // GIVEN: MSW returns 2 clients for GET /api/v1/clientes
    // WHEN:  useClientes hook is rendered
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    // THEN: Hook eventually resolves with the 2 clients
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].nombre).toBe('Cliente A')
    expect(result.current.data![1].nombre).toBe('Cliente B')
  })

  it('should include nit in each returned client object', async () => {
    // GIVEN: MSW returns clients with nit fields
    // WHEN:  useClientes resolves
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    // THEN: Each client has a nit property
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    result.current.data!.forEach((c) => {
      expect(c).toHaveProperty('nit')
      expect(typeof c.nit).toBe('string')
    })
  })

  it('should expose isLoading as true initially before the query settles', async () => {
    // GIVEN: The hook is rendered
    // WHEN:  First render (before network response)
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    // THEN: isLoading is true on initial render (before data arrives)
    expect(result.current.isLoading).toBe(true)
  })

  it('should expose isError as false on successful fetch', async () => {
    // GIVEN: MSW returns 200 with client list
    // WHEN:  Hook resolves
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: isError is false
    expect(result.current.isError).toBe(false)
  })

  it('should expose isError as true when the API returns a network error', async () => {
    // GIVEN: MSW returns a network error for GET /api/v1/clientes
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () =>
        HttpResponse.error()
      )
    )
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    // THEN: isError becomes true after the request fails
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('should expose a refetch function', async () => {
    // GIVEN: Hook is rendered
    // WHEN:  We inspect the hook return value
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should use queryKey [clientes] for caching', async () => {
    // GIVEN: A QueryClient spy
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { useClientes } = await import('../useClientes')

    const { result } = renderHook(() => useClientes(), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: The cache has data stored under the ['clientes'] key
    const cachedData = queryClient.getQueryData(['clientes'])
    expect(cachedData).toBeDefined()
    expect(Array.isArray(cachedData)).toBe(true)
  })
})

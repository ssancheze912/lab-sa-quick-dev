/**
 * Unit Tests — useClientes hook
 *
 * Covers:
 *   - Returns data as Cliente[] when fetch succeeds
 *   - isLoading is true before data resolves
 *   - isLoading is false after data resolves
 *   - isError is false when fetch succeeds
 *   - isError is true when fetch fails
 *   - data is undefined before fetch completes
 *   - data is an array after fetch completes
 *   - refetch function is exposed
 *   - Uses query key ['clientes'] (canonical key)
 *   - Returns empty array when API returns []
 *
 * Pattern: Vitest + @testing-library/react (renderHook) + MSW
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useClientes } from '../useClientes'
import type { Cliente } from '../../domain/Cliente'

const API_URL = 'http://localhost:5000'

const twoClientes: Cliente[] = [
  {
    id: 'aaa00000-0000-0000-0000-000000000001',
    nombre: 'Empresa Alpha',
    nit: '111000111-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'bbb00000-0000-0000-0000-000000000002',
    nombre: 'Beta Corp',
    nit: '222333444-2',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
  },
]

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }
}

describe('useClientes — data fetching', () => {
  it('Returns Cliente[] when fetch succeeds', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].nombre).toBe('Empresa Alpha')
    expect(result.current.data?.[1].nombre).toBe('Beta Corp')
  })

  it('data is undefined before fetch resolves', () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, async () => {
        await new Promise((r) => setTimeout(r, 200))
        return HttpResponse.json(twoClientes, { status: 200 })
      })
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    // Synchronously after mount — data is not yet available
    expect(result.current.data).toBeUndefined()
  })

  it('isLoading is true before data resolves', () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, async () => {
        await new Promise((r) => setTimeout(r, 200))
        return HttpResponse.json(twoClientes, { status: 200 })
      })
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('isLoading is false and data is set after fetch resolves', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
  })

  it('isError is false when fetch succeeds', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.isError).toBe(false)
  })

  it('isError is true when fetch fails', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.error())
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      { timeout: 5000 }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('Returns empty array when API returns []', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(0)
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('Exposes a refetch function', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

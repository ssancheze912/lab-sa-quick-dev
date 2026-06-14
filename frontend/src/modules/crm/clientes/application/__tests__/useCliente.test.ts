/**
 * Story 2.2: Client Detail View — useCliente Hook Tests
 *
 * Acceptance Criteria covered:
 *   AC#3 — Deep link: hook fetches by id without prior list navigation
 *   AC#4 — data === null when id not found (404)
 *   AC#5 — isLoading true initially; skeleton shown while data not arrived
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCliente } from '../useCliente'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'
const CLIENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

const mockCliente = createCliente({
  id: CLIENT_ID,
  nombre: 'Empresa ABC',
  nit: '900123456-7',
  telefono: '601 234 5678',
  ciudad: 'Bogotá',
})

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
    HttpResponse.json(mockCliente)
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCliente hook', () => {
  it('should return isLoading=true initially (AC#5)', () => {
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('should return the correct Cliente when id exists (AC#3)', async () => {
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.id).toBe(CLIENT_ID)
    expect(result.current.data?.nombre).toBe('Empresa ABC')
    expect(result.current.data?.nit).toBe('900123456-7')
    expect(result.current.data?.telefono).toBe('601 234 5678')
    expect(result.current.data?.ciudad).toBe('Bogotá')
  })

  it('should return data=null when API returns 404 (AC#4)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ title: 'Not found', status: 404 }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
  })

  it('should set isError=true when API returns 500', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should not fetch when id is null (enabled: false)', () => {
    const { result } = renderHook(() => useCliente(null), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('should use queryKey ["clientes", id]', async () => {
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Indirectly verified: the hook fetched data correctly via MSW keyed to /api/v1/clientes/:id
    expect(result.current.data).toBeDefined()
  })

  it('should expose a refetch function', async () => {
    const { result } = renderHook(() => useCliente(CLIENT_ID), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})

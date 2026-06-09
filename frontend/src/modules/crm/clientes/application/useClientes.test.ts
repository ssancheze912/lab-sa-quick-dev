/**
 * Story 2.1: Client List & Search
 * TC-E2-P3-04: useClientes hook returns typed Cliente[] with correct fields
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { useClientes } from './useClientes'
import type { Cliente } from '../domain/Cliente'

const mockClientes: Cliente[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corp',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Beta SA',
    nit: '800234567-2',
    telefono: '3112345678',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes)
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return Wrapper
}

describe('useClientes', () => {
  // TC-E2-P3-04: hook returns typed Cliente[]
  test('returns typed Cliente[] with correct fields', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)

    const first = data![0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('nombre')
    expect(first).toHaveProperty('nit')
    expect(first).toHaveProperty('telefono')
    expect(first).toHaveProperty('ciudad')
    expect(first).toHaveProperty('createdAt')
    expect(first.nombre).toBe('Acme Corp')
    expect(first.nit).toBe('900123456-1')
  })

  test('returns isLoading=true initially', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  test('exposes refetch function', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(typeof result.current.refetch).toBe('function')
  })
})

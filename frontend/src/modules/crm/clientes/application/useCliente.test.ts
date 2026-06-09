/**
 * Story 2.2: Client Detail View
 * TC-E2-P3: useCliente(id) hook — returns typed Cliente with correct fields
 *
 * RED PHASE: These tests are intentionally written to FAIL until
 * `useCliente.ts` is created under the same directory.
 *
 * Acceptance Criteria covered:
 *   AC#2 — useCliente(id) fetches GET /api/v1/clientes/:id and returns the typed Cliente
 *   AC#3 — useCliente(id) exposes isError when the API returns 404
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { useCliente } from './useCliente'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockCliente: Cliente = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  nombre: 'Empresa Detail Test SA',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    const { id } = params
    if (id === mockCliente.id) {
      return HttpResponse.json(mockCliente)
    }
    return HttpResponse.json(
      { status: 404, title: 'Cliente no encontrado.', detail: `Cliente con id '${id}' no encontrado.` },
      { status: 404 },
    )
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCliente', () => {
  // GIVEN: A valid clienteId is provided to the hook
  // WHEN: The hook fetches GET /api/v1/clientes/:id
  // THEN: isSuccess becomes true and data contains the full ClienteDto

  test('returns typed Cliente with all required fields on success', async () => {
    // GIVEN: The MSW server returns a ClienteDto for the known ID
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper })

    // WHEN: The hook resolves
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: data contains all 6 required ClienteDto fields
    const data = result.current.data
    expect(data).toBeDefined()
    expect(data).toHaveProperty('id', mockCliente.id)
    expect(data).toHaveProperty('nombre', 'Empresa Detail Test SA')
    expect(data).toHaveProperty('nit', '900123456-1')
    expect(data).toHaveProperty('telefono', '3001234567')
    expect(data).toHaveProperty('ciudad', 'Bogotá')
    expect(data).toHaveProperty('createdAt')
  })

  test('returns isLoading=true initially when id is provided', () => {
    // GIVEN: The hook is called with a valid ID
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper })

    // WHEN: The hook has just been mounted (no response yet)
    // THEN: isLoading is true
    expect(result.current.isLoading).toBe(true)
  })

  test('uses queryKey [clientes, id] array shape (canonical per architecture.md)', async () => {
    // GIVEN: The hook is called with a known ID
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: The cache key is the array ['clientes', id] — NOT a string 'clientes-id'
    const cachedData = queryClient.getQueryData<Cliente>(['clientes', mockCliente.id])
    expect(cachedData).toBeDefined()
    expect(cachedData?.nombre).toBe('Empresa Detail Test SA')
  })

  test('does NOT fire the query when id is empty string (enabled: Boolean(id))', () => {
    // GIVEN: The hook is called with an empty string id
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCliente(''), { wrapper })

    // WHEN: The hook evaluates enabled: Boolean('')
    // THEN: isLoading is false (query is disabled, not pending)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  test('returns isError=true when API responds with 404', async () => {
    // GIVEN: The MSW server returns 404 for an unknown ID
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCliente('id-que-no-existe'), { wrapper })

    // WHEN: The hook receives the 404 response
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: isError is true and data is undefined
    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  test('exposes refetch function', async () => {
    // GIVEN: The hook resolves successfully
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCliente(mockCliente.id), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // THEN: refetch is a callable function (used by ErrorPanel onRetry)
    expect(typeof result.current.refetch).toBe('function')
  })
})

/// @vitest-environment jsdom
/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Hook Unit Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — useClientes hook returns data from GET /api/v1/clientes
 *   AC4 — useClientes hook returns isError: true on network failure
 *
 * RED phase: These tests fail because:
 *   1. useClientes hook does not exist at
 *      frontend/src/modules/crm/clientes/application/useClientes.ts
 *   2. clienteApiRepository does not exist at
 *      frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
 *   3. MSW handler for GET /api/v1/clientes not yet wired at the hook level
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// The hook under test — does not exist yet (RED phase)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — intentional: module will not exist until implementation
import { useClientes } from '../../modules/crm/clientes/application/useClientes'

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    nombre: 'ACME S.A.',
    nit: '900123456-1',
    telefono: '6014567890',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    nombre: 'Beta Corp',
    nit: '900200002-2',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-03-13T09:00:00Z',
    updatedAt: '2026-03-13T09:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper factory
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC1: returns data from GET /api/v1/clientes', () => {
  it('Given the backend returns clients, When useClientes is called, Then data contains all clients', async () => {
    // GIVEN: MSW returns mock clients
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(mockClientes)
      )
    )

    // WHEN: Hook is rendered inside QueryClientProvider
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    // THEN: Hook resolves with the client data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].nombre).toBe('ACME S.A.')
    expect(result.current.data?.[1].nit).toBe('900200002-2')
  })

  it('Given the backend returns clients, Then each client has the expected shape (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)', async () => {
    // GIVEN: MSW returns a single client
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([mockClientes[0]])
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const cliente = result.current.data?.[0]
    expect(cliente).toHaveProperty('id')
    expect(cliente).toHaveProperty('nombre')
    expect(cliente).toHaveProperty('nit')
    expect(cliente).toHaveProperty('telefono')
    expect(cliente).toHaveProperty('ciudad')
    expect(cliente).toHaveProperty('createdAt')
    expect(cliente).toHaveProperty('updatedAt')
  })

  it('Given the backend returns an empty array, When useClientes is called, Then data is an empty array', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.json([]))
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })
})

describe('useClientes — AC4: returns isError on network failure', () => {
  it('Given the backend is unavailable, When useClientes is called, Then isError is true', async () => {
    // GIVEN: MSW returns a network error
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.error())
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    // THEN: Hook exposes isError = true after failure
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      { timeout: 3000 }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('Given the backend returns 500, When useClientes is called, Then isError is true', async () => {
    // GIVEN: Backend returns HTTP 500
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      { timeout: 3000 }
    )
  })

  it('Given useClientes, Then the hook exposes a refetch function', async () => {
    // GIVEN: Backend returns clients
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(mockClientes)
      )
    )

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // THEN: refetch function is available (required for ErrorPanel retry)
    expect(typeof result.current.refetch).toBe('function')
  })

  it('Given useClientes, Then the queryKey is ["clientes"] (canonical key — array form, NOT string)', async () => {
    // GIVEN: Backend returns clients
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(mockClientes)
      )
    )

    // WHEN: We inspect the hook source for the canonical queryKey
    // This is a structural assertion via file content since we cannot inspect
    // queryKey at runtime without deep TanStack internals
    const { readFileSync, existsSync } = await import('fs')
    const { resolve } = await import('path')
    const { fileURLToPath } = await import('url')
    const { dirname } = await import('path')

    const __filename = fileURLToPath(import.meta.url)
    const __dir = dirname(__filename)
    const hookPath = resolve(__dir, '../../modules/crm/clientes/application/useClientes.ts')

    // THEN: The hook file exists and uses queryKey: ['clientes']
    expect(existsSync(hookPath)).toBe(true)
    const content = readFileSync(hookPath, 'utf-8')
    // Must use array form ['clientes'], not string 'clientes'
    expect(content).toMatch(/queryKey\s*:\s*\[\s*['"`]clientes['"`]\s*\]/)
  })
})

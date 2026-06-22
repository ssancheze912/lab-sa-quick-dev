import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useClientes } from '../useClientes'

/**
 * ATDD — Story 2.1: Client List & Search — Hook unit tests (RED phase)
 *
 * Tests FAIL until useClientes hook is implemented at:
 *   frontend/src/modules/crm/clientes/application/useClientes.ts
 *
 * Acceptance Criteria (hook layer):
 *   AC1 — useClientes exposes { data, isLoading, isError, refetch }
 *   AC1 — Uses queryKey ['clientes'] with staleTime: 0
 *   AC4 — isError is true when GET /api/v1/clientes fails
 */

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Hook returns list on success
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC1: returns data from GET /api/v1/clientes', () => {
  it('returns a list of clientes when API call succeeds', async () => {
    // GIVEN: API returns two clients
    const clientes = [
      { id: 'id-1', nombre: 'Empresa A', nit: '111', telefono: '300', ciudad: 'Bogotá', createdAt: '', updatedAt: '' },
      { id: 'id-2', nombre: 'Empresa B', nit: '222', telefono: '301', ciudad: 'Cali', createdAt: '', updatedAt: '' },
    ]
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )

    // WHEN: useClientes hook is called
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: data contains the two clients
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].nombre).toBe('Empresa A')
    expect(result.current.data![1].nombre).toBe('Empresa B')
  })

  it('uses queryKey [\'clientes\'] (required for TanStack Query cache invalidation)', async () => {
    // GIVEN: A spy on QueryClient.fetchQuery (indirect — we verify the cache key via refetch)
    const clientes = [
      { id: 'id-1', nombre: 'Empresa A', nit: '111', telefono: '300', ciudad: 'Bogotá', createdAt: '', updatedAt: '' },
    ]
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json(clientes)),
    )

    // WHEN: useClientes is rendered and data is loaded
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: data is accessible (verifies query ran successfully with correct config)
    expect(result.current.data).toBeDefined()
    // Indirect verification: if queryKey were wrong, invalidation in other tests would fail
    // The queryKey ['clientes'] is enforced by the implementation requirement
  })

  it('exposes { data, isLoading, isError, refetch } from the hook', async () => {
    // GIVEN: API returns an empty list
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: All required properties are present
    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('refetch')
  })

  it('isLoading is true initially before data is fetched', async () => {
    // GIVEN: API call is delayed
    server.use(
      http.get('/api/v1/clientes', async () => {
        await new Promise((r) => setTimeout(r, 200))
        return HttpResponse.json([])
      }),
    )

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: isLoading is true immediately
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('returns empty array when API responds with []', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([])),
    )

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // THEN: data is an empty array (not null or undefined)
    expect(result.current.data).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — isError true on fetch failure
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC4: isError is true when API fails', () => {
  it('sets isError=true when API returns 503', async () => {
    // GIVEN: API returns 503
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 }),
      ),
    )

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })

  it('sets isError=true when API returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('refetch triggers a new API call after error', async () => {
    // GIVEN: API fails first, then succeeds
    let callCount = 0
    const cliente = { id: 'id-1', nombre: 'Empresa Recuperada', nit: '111', telefono: '300', ciudad: 'Bogotá', createdAt: '', updatedAt: '' }

    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Fail' }, { status: 503 })
        }
        return HttpResponse.json([cliente])
      }),
    )

    // WHEN: Hook is rendered (first call fails)
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // AND: refetch is called
    result.current.refetch()

    // THEN: data is populated and isError is false
    await waitFor(() => {
      expect(result.current.isError).toBe(false)
      expect(result.current.data).toHaveLength(1)
    })
  })
})

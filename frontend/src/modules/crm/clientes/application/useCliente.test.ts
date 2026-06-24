/**
 * Unit Tests — Story 2.2: useCliente hook
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * File under test (does NOT exist yet — must be created by DEV):
 *   frontend/src/modules/crm/clientes/application/useCliente.ts
 *
 * Acceptance Criteria covered:
 *   AC2 — Hook fetches GET /api/v1/clientes/:id and returns client data
 *   AC4 — Hook exposes isError + refetch on API failure
 *   AC5 — Hook exposes isLoading while fetch is in-flight
 *
 * Stack: Vitest + React Testing Library + MSW (Node handler)
 * Pattern: Arrange / Act / Assert
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// The hook under test — does NOT exist until DEV implements it (RED phase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useCliente: (id: string | undefined) => any;
try {
  useCliente = (await import('./useCliente')).useCliente
} catch {
  useCliente = () => ({ data: undefined, isLoading: false, isError: true, error: null, refetch: () => Promise.resolve() })
}

const MOCK_CLIENTE = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Hook Test',
  nit: '900000001-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === MOCK_CLIENTE.id) {
      return HttpResponse.json(MOCK_CLIENTE)
    }
    return HttpResponse.json(
      { status: 404, title: 'Not Found', detail: `Cliente with id '${String(params.id)}' was not found.` },
      { status: 404 }
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCliente hook', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // AC2 — Successful fetch
  // ─────────────────────────────────────────────────────────────────────────

  it('should return client data when the API fetch succeeds', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(MOCK_CLIENTE.id), { wrapper })

    // Assert
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
    expect(result.current.data?.id).toBe(MOCK_CLIENTE.id)
    expect(result.current.data?.nombre).toBe(MOCK_CLIENTE.nombre)
    expect(result.current.data?.nit).toBe(MOCK_CLIENTE.nit)
    expect(result.current.data?.telefono).toBe(MOCK_CLIENTE.telefono)
    expect(result.current.data?.ciudad).toBe(MOCK_CLIENTE.ciudad)
  })

  it('should use the canonical query key ["clientes", id]', async () => {
    // Arrange
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // Act
    const { result } = renderHook(() => useCliente(MOCK_CLIENTE.id), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    // Assert: data is cached under the canonical key
    const cachedData = queryClient.getQueryData(['clientes', MOCK_CLIENTE.id])
    expect(cachedData).toBeDefined()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC5 — Loading state while fetch is in-flight
  // ─────────────────────────────────────────────────────────────────────────

  it('should return isLoading=true while the fetch is in-flight', async () => {
    // Arrange: delay the server response
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(MOCK_CLIENTE)
      })
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(MOCK_CLIENTE.id), { wrapper })

    // Assert: loading is true immediately after mount
    expect(result.current.isLoading).toBe(true)

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC4 — Error state on API failure
  // ─────────────────────────────────────────────────────────────────────────

  it('should return isError=true when the API returns a 500 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      })
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(MOCK_CLIENTE.id), { wrapper })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should expose a refetch function when the fetch fails', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => HttpResponse.error())
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(MOCK_CLIENTE.id), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Assert: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should return isError=true when the API returns a 404 for a non-existent client', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act: use a non-existent ID (MSW returns 404 for any non-matching ID)
    const { result } = renderHook(() => useCliente('99999999-9999-9999-9999-999999999999'), { wrapper })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Query disabled when id is undefined or empty
  // ─────────────────────────────────────────────────────────────────────────

  it('should NOT fetch when id is undefined (query disabled)', async () => {
    // Arrange
    let fetchAttempted = false
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        fetchAttempted = true
        return HttpResponse.json(MOCK_CLIENTE)
      })
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(undefined), { wrapper })

    // Wait briefly to confirm no fetch occurs
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Assert: query is disabled, no fetch, no data
    expect(fetchAttempted).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('should NOT fetch when id is an empty string (query disabled)', async () => {
    // Arrange
    let fetchAttempted = false
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        fetchAttempted = true
        return HttpResponse.json(MOCK_CLIENTE)
      })
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useCliente(''), { wrapper })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Assert: query is disabled, no fetch
    expect(fetchAttempted).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})

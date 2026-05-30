// Story 2.2: Client Detail View
// ATDD Hook Tests — useCliente
// Status: RED — Tests fail until useCliente hook is implemented
// AC covered:
//   AC#2 — id provided → query enabled → MSW returns client → data populated
//   AC#4 — MSW returns 404 → isError: true (hook-level error)
//   AC#4 — id undefined → query disabled → no API call made
// Test cases mapped to story testing strategy (Task 12)

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useCliente } from './useCliente'
import { mockClientes } from '../../../../__mocks__/handlers/clientes'

// ---------------------------------------------------------------------------
// Test fixture data
// ---------------------------------------------------------------------------
const mockCliente = mockClientes[0] // Ana García — id: a1b2c3d4-0000-0000-0000-000000000001

// ---------------------------------------------------------------------------
// MSW server — intercept before any hook renders
// ---------------------------------------------------------------------------
const server = setupServer(
  http.get('/api/v1/clientes/:id', ({ params }) => {
    const { id } = params
    const found = mockClientes.find((c) => c.id === id)
    if (!found) {
      return HttpResponse.json(
        {
          status: 404,
          title: 'Cliente no encontrado',
          detail: `No existe un cliente con ID ${id}.`,
        },
        { status: 404 }
      )
    }
    return HttpResponse.json(found)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Helper: fresh QueryClient + wrapper per test (no cache bleed)
// ---------------------------------------------------------------------------
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return wrapper
}

// ---------------------------------------------------------------------------
// AC#4 / Task 12: enabled: false when id is undefined — no API call made
// ---------------------------------------------------------------------------
describe('useCliente — query disabled when id is undefined', () => {
  it('Given id is undefined When hook renders Then query is disabled and no API call is made', async () => {
    // GIVEN: id undefined → enabled: !!id → false
    let apiCallCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        apiCallCount++
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    })

    // Give time for any accidental fetch
    await new Promise((resolve) => setTimeout(resolve, 50))

    // THEN: No API call made, data is undefined
    expect(apiCallCount).toBe(0)
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('Given id is empty string When hook renders Then query is disabled', async () => {
    // GIVEN: empty string is falsy → enabled: !!'' → false
    let apiCallCount = 0
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        apiCallCount++
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN
    const { result } = renderHook(() => useCliente(''), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // THEN
    expect(apiCallCount).toBe(0)
    expect(result.current.data).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// AC#2 / Task 12: id provided → query enabled → data populated
// ---------------------------------------------------------------------------
describe('useCliente — query enabled when id is provided', () => {
  it('Given valid id When hook renders Then query fetches GET /api/v1/clientes/:id', async () => {
    // GIVEN: Valid client id
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // WHEN: Hook executes query

    // THEN: Data is eventually populated with the client object
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data?.id).toBe(mockCliente.id)
  })

  it('Given valid id When query resolves Then data contains Nombre', async () => {
    // GIVEN
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // THEN
    await waitFor(() => {
      expect(result.current.data?.nombre).toBe('Ana García')
    })
  })

  it('Given valid id When query resolves Then data contains NIT', async () => {
    // GIVEN
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // THEN
    await waitFor(() => {
      expect(result.current.data?.nit).toBe('900-111-001')
    })
  })

  it('Given valid id When query resolves Then data contains Teléfono', async () => {
    // GIVEN
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // THEN
    await waitFor(() => {
      expect(result.current.data?.telefono).toBe('3001111111')
    })
  })

  it('Given valid id When query resolves Then data contains Ciudad', async () => {
    // GIVEN
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // THEN
    await waitFor(() => {
      expect(result.current.data?.ciudad).toBe('Bogotá')
    })
  })

  it('Given valid id When query starts Then isLoading is initially true', () => {
    // GIVEN: Slow MSW response to capture loading state
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(mockCliente)
      })
    )

    // WHEN
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // THEN: Hook is loading initially
    expect(result.current.isLoading).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC#4 / Task 12: MSW returns 404 → isError: true
// ---------------------------------------------------------------------------
describe('useCliente — isError true when backend returns 404', () => {
  it('Given id does not exist When backend returns 404 Then isError is true', async () => {
    // GIVEN: non-existent id → MSW returns 404 (default handler)
    const nonExistentId = '00000000-0000-0000-0000-000000000099'

    // WHEN
    const { result } = renderHook(() => useCliente(nonExistentId), {
      wrapper: createWrapper(),
    })

    // THEN: isError is set to true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('Given id does not exist When backend returns 404 Then data is undefined', async () => {
    // GIVEN
    const nonExistentId = '00000000-0000-0000-0000-000000000099'

    // WHEN
    const { result } = renderHook(() => useCliente(nonExistentId), {
      wrapper: createWrapper(),
    })

    // THEN
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })

  it('Given id does not exist When backend returns 404 Then error is exposed for 404 detection', async () => {
    // GIVEN: Component needs to distinguish 404 from network error via error.response?.status
    const nonExistentId = '00000000-0000-0000-0000-000000000099'

    // WHEN
    const { result } = renderHook(() => useCliente(nonExistentId), {
      wrapper: createWrapper(),
    })

    // THEN: error object is available (Axios error with response.status = 404)
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
  })
})

// ---------------------------------------------------------------------------
// Hook exports refetch (AC#4 — retry support)
// ---------------------------------------------------------------------------
describe('useCliente — refetch function is exported', () => {
  it('Given valid id When hook renders Then refetch function is available', async () => {
    // GIVEN
    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    })

    // THEN: refetch is a function (required for AC4 retry button)
    expect(typeof result.current.refetch).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Query key uniqueness — different IDs use different cache slots
// ---------------------------------------------------------------------------
describe('useCliente — uses correct query key [clientes, id]', () => {
  it('Given two different ids When each hook renders Then each makes its own independent fetch', async () => {
    // GIVEN: Two clients
    const client1 = mockClientes[0]
    const client2 = mockClientes[1]

    const { result: result1 } = renderHook(() => useCliente(client1.id), {
      wrapper: createWrapper(),
    })
    const { result: result2 } = renderHook(() => useCliente(client2.id), {
      wrapper: createWrapper(),
    })

    // THEN: Each hook receives its own client data
    await waitFor(() => {
      expect(result1.current.data?.id).toBe(client1.id)
    })
    await waitFor(() => {
      expect(result2.current.data?.id).toBe(client2.id)
    })
  })
})

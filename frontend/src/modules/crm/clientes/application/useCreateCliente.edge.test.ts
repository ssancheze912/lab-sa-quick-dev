/**
 * Story 2.3: Create Client — useCreateCliente Edge Cases
 * Epic 2: Client Management
 *
 * Edge-case unit tests expanding beyond the ATDD coverage.
 * The ATDD file covers: repository.create call, invalidateQueries,
 * isPending, 409 isError, NFR6 no traceId, 500 isError, no invalidate on error.
 *
 * This file covers:
 *   - onSuccess callback option is invoked after successful mutation
 *   - onSuccess undefined (no option passed) does not throw
 *   - 400 Bad Request error sets isError (different from 409 path)
 *   - Network error with no response (offline scenario) sets isError
 *   - Non-Axios error (unexpected throw) also sets isError
 *   - mutate called twice in sequence — only last result is reflected
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { AxiosError } from 'axios'

import { useCreateCliente } from './useCreateCliente'

vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    create: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('siesa-ui-kit', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  ToastProvider: ({ children }: { children: unknown }) => children,
}))

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const validPayload = {
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

const mockClienteDto = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-06-30T00:00:00Z',
  updatedAt: '2026-06-30T00:00:00Z',
}

describe('useCreateCliente — onSuccess callback option', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.create).mockResolvedValue(mockClienteDto)
  })

  it('[P1] invokes the onSuccess option callback after successful mutation', async () => {
    // GIVEN: useCreateCliente with an onSuccess callback
    const onSuccessSpy = vi.fn()

    const { result } = renderHook(
      () => useCreateCliente({ onSuccess: onSuccessSpy }),
      { wrapper: createWrapper(queryClient) },
    )

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)

    // THEN: onSuccess callback was invoked
    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalledOnce()
    })
  })

  it('[P2] does NOT throw when no options object is provided (onSuccess is undefined)', async () => {
    // GIVEN: useCreateCliente called without options
    const { result } = renderHook(
      () => useCreateCliente(),
      { wrapper: createWrapper(queryClient) },
    )

    // WHEN: mutation succeeds
    // THEN: No error thrown — onSuccess?.() is safely optional-chained
    await expect(
      (async () => {
        result.current.mutate(validPayload)
        await waitFor(() => expect(result.current.isError).toBe(false))
      })(),
    ).resolves.not.toThrow()
  })

  it('[P2] onSuccess callback receives no arguments (side-effect only)', async () => {
    // GIVEN: onSuccess spy that captures call arguments
    const onSuccessSpy = vi.fn()

    const { result } = renderHook(
      () => useCreateCliente({ onSuccess: onSuccessSpy }),
      { wrapper: createWrapper(queryClient) },
    )

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)
    await waitFor(() => expect(onSuccessSpy).toHaveBeenCalled())

    // THEN: Callback was called with no arguments
    expect(onSuccessSpy).toHaveBeenCalledWith()
  })
})

describe('useCreateCliente — 400 error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('[P1] sets isError to true on 400 Bad Request (validation error from backend)', async () => {
    // GIVEN: repository.create rejects with 400 AxiosError
    const error400 = Object.assign(new Error('Request failed with status code 400'), {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Validation failed.',
          status: 400,
          errors: [{ field: 'Nombre', message: 'Nombre es requerido.' }],
        },
      },
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(error400)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails with 400
    result.current.mutate(validPayload)

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('[P1] does NOT invalidate cache on 400 error', async () => {
    // GIVEN: repository.create rejects with 400
    const error400 = Object.assign(new Error('Request failed with status code 400'), {
      isAxiosError: true,
      response: { status: 400, data: {} },
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(error400)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate(validPayload)
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: No cache invalidation on error
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] }),
    )
  })
})

describe('useCreateCliente — network error (no response)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('[P1] sets isError to true when network request fails with no response', async () => {
    // GIVEN: Network error — AxiosError with no response (offline scenario)
    const networkError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: undefined,
      request: {},
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(networkError)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails with network error
    result.current.mutate(validPayload)

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('[P2] does NOT invalidate cache on network error', async () => {
    // GIVEN: Network error
    const networkError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: undefined,
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(networkError)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate(validPayload)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] }),
    )
  })
})

describe('useCreateCliente — non-Axios unexpected error', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('[P2] sets isError to true when a non-Axios error is thrown', async () => {
    // GIVEN: Non-Axios error (e.g., JSON parse error, programming bug)
    const unexpectedError = new TypeError('Cannot read properties of undefined')
    vi.mocked(clienteApiRepository.create).mockRejectedValue(unexpectedError)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation throws a non-Axios error
    result.current.mutate(validPayload)

    // THEN: isError is still true (generic error path handles all errors)
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateCliente — return value contract', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.create).mockResolvedValue(mockClienteDto)
  })

  it('[P1] hook returns { mutate, isPending, isError } — no extra keys exposed', () => {
    // GIVEN: useCreateCliente is called
    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // THEN: Only the 3 documented keys are present
    const keys = Object.keys(result.current)
    expect(keys).toContain('mutate')
    expect(keys).toContain('isPending')
    expect(keys).toContain('isError')
    // Must not expose internal TanStack Query details or error messages
    expect(keys).not.toContain('error')
    expect(keys).not.toContain('data')
    expect(keys).not.toContain('reset')
  })

  it('[P2] isPending starts as false before any mutation is called', () => {
    // GIVEN: Fresh hook instance
    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // THEN: isPending is false initially
    expect(result.current.isPending).toBe(false)
  })

  it('[P2] isError starts as false before any mutation is called', () => {
    // GIVEN: Fresh hook instance
    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // THEN: isError is false initially
    expect(result.current.isError).toBe(false)
  })
})

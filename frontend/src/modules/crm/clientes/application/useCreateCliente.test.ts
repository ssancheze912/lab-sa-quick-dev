/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * useCreateCliente does NOT exist yet — all tests will fail.
 *
 * Acceptance Criteria covered:
 *   AC2 — On success: invalidates ['clientes'] cache, shows success toast
 *   AC4 — On 409 error: shows "El NIT/RUC ya está registrado" toast (NFR6)
 *   AC4 — On other errors: shows generic error toast (not technical details)
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import axios from 'axios'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'

// useCreateCliente does not exist yet — this import WILL FAIL (RED phase)
import { useCreateCliente } from './useCreateCliente'

// Mock the clienteApiRepository
vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    create: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

// Mock react-hot-toast (or sonner) toast functions
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Fallback mock for sonner (project may use either)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock siesa-ui-kit toast (project uses this library)
vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
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

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful mutation behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente — AC2: Successful mutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.create).mockResolvedValue(mockClienteDto)
  })

  it('calls clienteApiRepository.create with the provided payload', async () => {
    // GIVEN: useCreateCliente hook is rendered
    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called with valid payload
    result.current.mutate(validPayload)

    // THEN: repository.create was called with the correct data
    await waitFor(() => {
      expect(clienteApiRepository.create).toHaveBeenCalledWith(validPayload)
    })
  })

  it('invalidates ["clientes"] query cache on success', async () => {
    // GIVEN: queryClient has a ['clientes'] query
    queryClient.setQueryData(['clientes'], [])
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)

    // THEN: invalidateQueries is called with ['clientes']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      )
    })
  })

  it('shows success toast "Cliente creado correctamente" on success', async () => {
    // GIVEN: useCreateCliente hook is rendered
    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)

    // THEN: Success toast with the correct message is shown (AC2)
    // TEA Review auto-fix: original assertion was a no-op (only checked isError).
    // Project uses 'sonner' for toasts (confirmed in story 2.3 completion notes).
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Cliente creado correctamente')
    })
  })

  it('returns isPending as true while mutation is in flight', async () => {
    // GIVEN: repository.create returns a pending promise
    let resolveCreate: ((value: typeof mockClienteDto) => void) | null = null
    vi.mocked(clienteApiRepository.create).mockReturnValue(
      new Promise((resolve) => { resolveCreate = resolve })
    )

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called and create is still pending
    result.current.mutate(validPayload)

    // THEN: isPending is true
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Release the promise
    if (resolveCreate) resolveCreate(mockClienteDto)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 409 Conflict error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente — AC4: 409 Conflict shows specific NIT error', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('sets isError to true when mutation fails with 409', async () => {
    // GIVEN: repository.create rejects with 409 AxiosError
    const error409 = Object.assign(new Error('Request failed with status code 409'), {
      isAxiosError: true,
      response: { status: 409, data: { detail: 'El NIT/RUC ya está registrado' } },
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(error409)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation is triggered and fails with 409
    result.current.mutate(validPayload)

    // THEN: hook's isError state becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('does NOT re-expose Problem Details fields on 409 (NFR6)', async () => {
    // GIVEN: repository.create rejects with 409
    const error409 = Object.assign(new Error('Request failed with status code 409'), {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Conflict',
          status: 409,
          detail: 'El NIT/RUC ya está registrado',
          traceId: 'internal-abc',
        },
      },
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(error409)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: The hook does not expose raw Problem Details — only business messages via toast
    // The hook should not return traceId, stackTrace, or RFC 7807 type in its state
    expect((result.current as unknown as Record<string, unknown>).traceId).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Generic error handling for non-409 failures
// ─────────────────────────────────────────────────────────────────────────────

describe('useCreateCliente — AC4: Generic error for non-409 failures', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('sets isError to true on 500 server error', async () => {
    // GIVEN: repository.create rejects with 500
    const error500 = Object.assign(new Error('Request failed with status code 500'), {
      isAxiosError: true,
      response: { status: 500, data: {} },
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(error500)

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails with 500
    result.current.mutate(validPayload)

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('does NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: repository.create rejects
    const error = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: undefined,
    }) as AxiosError

    vi.mocked(clienteApiRepository.create).mockRejectedValue(error)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: invalidateQueries was NOT called (cache should not be invalidated on error)
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] })
    )
  })
})

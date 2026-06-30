/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * useUpdateCliente does NOT exist yet — all tests will fail with module-not-found.
 *
 * Acceptance Criteria covered:
 *   AC2 — On success: invalidates ['clientes'] and ['clientes', id] cache,
 *          shows toast.success('Cliente actualizado correctamente')
 *   AC2/AC3 — On error: shows toast.error('No se pudo guardar. Intenta de nuevo.')
 *   AC3 — Hook exposes isPending, isError
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'

// useUpdateCliente does not exist yet — this import WILL FAIL (RED phase)
import { useUpdateCliente } from './useUpdateCliente'

// Mock the clienteApiRepository
vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    update: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

// Mock sonner toast (project uses sonner per Story 2.3 completion notes)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const CLIENTE_ID = '00000000-0000-0000-0000-000000000001'

const validPayload = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

const mockUpdatedClienteDto = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-30T00:00:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful mutation behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('useUpdateCliente — AC2: Successful mutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.update).mockResolvedValue(mockUpdatedClienteDto)
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('calls clienteApiRepository.update with the provided id and payload', async () => {
    // GIVEN: useUpdateCliente hook is rendered
    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called with valid payload
    result.current.mutate(validPayload)

    // THEN: repository.update was called with id and data
    await waitFor(() => {
      expect(clienteApiRepository.update).toHaveBeenCalledWith(CLIENTE_ID, validPayload)
    })
  })

  it('invalidates ["clientes"] query cache on success', async () => {
    // GIVEN: queryClient has a ['clientes'] query cached
    queryClient.setQueryData(['clientes'], [])
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)

    // THEN: invalidateQueries is called with ['clientes'] (list cache)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      )
    })
  })

  it('invalidates ["clientes", id] query cache on success (detail cache)', async () => {
    // GIVEN: queryClient has a ['clientes', id] detail query cached
    queryClient.setQueryData(['clientes', CLIENTE_ID], mockUpdatedClienteDto)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)

    // THEN: invalidateQueries is called with ['clientes', id] (detail cache — FR27)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes', CLIENTE_ID] })
      )
    })
  })

  it('shows success toast "Cliente actualizado correctamente" on success', async () => {
    // GIVEN: useUpdateCliente hook is rendered
    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation succeeds
    result.current.mutate(validPayload)

    // THEN: Success toast with the exact required message is shown (AC2)
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Cliente actualizado correctamente')
    })
  })

  it('returns isPending as true while mutation is in flight', async () => {
    // GIVEN: repository.update returns a pending promise
    let resolveUpdate: ((value: typeof mockUpdatedClienteDto) => void) | null = null
    vi.mocked(clienteApiRepository.update).mockReturnValue(
      new Promise((resolve) => { resolveUpdate = resolve })
    )

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called and update is still pending
    result.current.mutate(validPayload)

    // THEN: isPending is true
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Release the promise
    if (resolveUpdate) resolveUpdate(mockUpdatedClienteDto)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2/AC3 — Error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('useUpdateCliente — AC2/AC3: Error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('shows error toast "No se pudo guardar. Intenta de nuevo." on failure', async () => {
    // GIVEN: repository.update rejects
    vi.mocked(clienteApiRepository.update).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(validPayload)

    // THEN: Error toast with exact message is shown
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('No se pudo guardar. Intenta de nuevo.')
    })
  })

  it('sets isError to true when mutation fails with 400', async () => {
    // GIVEN: repository.update rejects with 400 AxiosError (validation — AC3)
    const error400 = Object.assign(new Error('Request failed with status code 400'), {
      isAxiosError: true,
      response: {
        status: 400,
        data: { status: 400, detail: 'Validation failed' },
      },
    }) as AxiosError

    vi.mocked(clienteApiRepository.update).mockRejectedValue(error400)

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation is triggered and fails with 400
    result.current.mutate(validPayload)

    // THEN: isError state is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('sets isError to true when mutation fails with 404', async () => {
    // GIVEN: repository.update rejects with 404 (client not found)
    const error404 = Object.assign(new Error('Request failed with status code 404'), {
      isAxiosError: true,
      response: { status: 404, data: { status: 404, detail: 'Not found' } },
    }) as AxiosError

    vi.mocked(clienteApiRepository.update).mockRejectedValue(error404)

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails with 404
    result.current.mutate(validPayload)

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('does NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: repository.update rejects
    vi.mocked(clienteApiRepository.update).mockRejectedValue(
      new Error('Server error')
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutation fails
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: cache is NOT invalidated on error
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] })
    )
  })

  it('does NOT expose Problem Details fields in hook state (NFR6)', async () => {
    // GIVEN: repository.update rejects with 404 Problem Details
    const error404 = Object.assign(new Error('Request failed with status code 404'), {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Not Found',
          status: 404,
          detail: 'Client not found',
          traceId: 'internal-trace-xyz',
        },
      },
    }) as AxiosError

    vi.mocked(clienteApiRepository.update).mockRejectedValue(error404)

    const { result } = renderHook(() => useUpdateCliente(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate(validPayload)
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: Hook does not expose traceId or RFC 7807 raw fields (NFR6)
    expect((result.current as unknown as Record<string, unknown>).traceId).toBeUndefined()
  })
})

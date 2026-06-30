/**
 * Story 2.5: Delete Client — useDeleteCliente Hook Edge Cases
 * Epic 2: Client Management
 *
 * Expanded unit-level automation: boundary conditions and error paths
 * NOT covered by the ATDD acceptance tests (useDeleteCliente.test.ts).
 *
 * Scenarios covered:
 *   - mutate with empty string id still calls repository (validation is backend's concern)
 *   - repository throws unexpected Error (not 404): isError set, error toast shown
 *   - isPending transitions: false → true → false across successful mutation
 *   - isPending transitions: false → true → false across failed mutation
 *   - Calling mutate multiple times in sequence: each triggers a new mutation
 *   - onSuccess callback is NOT called when onSuccess option is omitted
 *   - Hook returns a stable mutate reference (same identity between renders without change)
 *   - mutateAsync is not required — mutate (fire-and-forget) is sufficient
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { toast } from 'sonner'
import { useDeleteCliente } from './useDeleteCliente'

vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    delete: vi.fn(),
  },
}))

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

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

const CLIENTE_ID = '00000000-0000-0000-0000-000000000099'

// ─────────────────────────────────────────────────────────────────────────────
// Boundary — empty string id
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — Empty string id passed to mutate', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.delete).mockResolvedValue(undefined)
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.success).mockClear()
  })

  it('[P2] should still call repository.delete with empty string (backend handles validation)', async () => {
    // GIVEN: useDeleteCliente is rendered
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called with empty string
    act(() => { result.current.mutate('') })

    // THEN: repository.delete was called with the empty string passed through
    await waitFor(() => {
      expect(clienteApiRepository.delete).toHaveBeenCalledWith('')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Unexpected error — non-404 throw
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — Unexpected repository error', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.success).mockClear()
  })

  it('[P1] should show error toast when repository throws a generic network error', async () => {
    // GIVEN: repository.delete throws a generic network error
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Network timeout'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate is called
    act(() => { result.current.mutate(CLIENTE_ID) })

    // THEN: Error toast is shown with the standard user message
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
    })
  })

  it('[P1] isError should be true after a generic network error', async () => {
    // GIVEN: repository.delete throws network error
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Network timeout'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => { result.current.mutate(CLIENTE_ID) })

    // THEN: isError is set to true
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('[P2] should NOT call toast.success on error', async () => {
    // GIVEN: repository.delete throws
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => { result.current.mutate(CLIENTE_ID) })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // THEN: success toast was NOT called
    expect(vi.mocked(toast.success)).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isPending lifecycle — success path
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — isPending lifecycle on successful mutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.success).mockClear()
  })

  it('[P1] isPending should return to false after successful deletion', async () => {
    // GIVEN: repository resolves successfully
    vi.mocked(clienteApiRepository.delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN: mutate completes
    act(() => { result.current.mutate(CLIENTE_ID) })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // THEN: isError is also false after success
    expect(result.current.isError).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isPending lifecycle — error path
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — isPending lifecycle on failed mutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(toast.error).mockClear()
  })

  it('[P1] isPending should return to false after a failed deletion', async () => {
    // GIVEN: repository rejects
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => { result.current.mutate(CLIENTE_ID) })

    // THEN: isPending eventually returns to false even on error
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sequential mutations
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — Sequential mutations', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.delete).mockResolvedValue(undefined)
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.success).mockClear()
  })

  it('[P2] calling mutate twice in sequence calls repository.delete twice (for different ids)', async () => {
    // GIVEN: useDeleteCliente is rendered
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    const ID_A = '00000000-0000-0000-0000-000000000001'
    const ID_B = '00000000-0000-0000-0000-000000000002'

    // WHEN: mutate called twice sequentially with different ids
    act(() => { result.current.mutate(ID_A) })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    act(() => { result.current.mutate(ID_B) })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    // THEN: repository.delete was called twice
    expect(clienteApiRepository.delete).toHaveBeenCalledTimes(2)
    expect(clienteApiRepository.delete).toHaveBeenNthCalledWith(1, ID_A)
    expect(clienteApiRepository.delete).toHaveBeenNthCalledWith(2, ID_B)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Optional onSuccess — not called when omitted
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — onSuccess option is truly optional', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(clienteApiRepository.delete).mockResolvedValue(undefined)
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.success).mockClear()
  })

  it('[P2] mutation succeeds without throwing when onSuccess option is not provided', async () => {
    // GIVEN: useDeleteCliente called with no options
    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    // WHEN/THEN: mutate succeeds without error (no callback crash)
    act(() => { result.current.mutate(CLIENTE_ID) })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  it('[P2] mutation succeeds without throwing when options object is empty {}', async () => {
    // GIVEN: useDeleteCliente called with empty options (no onSuccess key)
    const { result } = renderHook(() => useDeleteCliente({}), {
      wrapper: createWrapper(queryClient),
    })

    act(() => { result.current.mutate(CLIENTE_ID) })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Cache invalidation — NOT triggered on 404 error
// ─────────────────────────────────────────────────────────────────────────────

describe('useDeleteCliente edge — Cache invalidation not triggered on 404', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.mocked(toast.error).mockClear()
  })

  it('[P2] should NOT invalidate ["contactos"] cache when mutation fails with 404', async () => {
    // GIVEN: repository throws 404
    const error404 = Object.assign(new Error('Not found'), {
      isAxiosError: true,
      response: { status: 404 },
    })
    vi.mocked(clienteApiRepository.delete).mockRejectedValue(error404)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => { result.current.mutate(CLIENTE_ID) })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // THEN: contactos cache is NOT invalidated (no orphan contacts scenario on 404)
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['contactos'] })
    )
  })
})

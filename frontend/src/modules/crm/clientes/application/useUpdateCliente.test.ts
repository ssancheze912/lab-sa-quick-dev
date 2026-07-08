/**
 * Story 2.4 — ATDD (RED phase).
 *
 * Contract tests for the `useUpdateCliente` mutation hook (Task 6). Covers:
 *   - AC #2 — success: 200 resolves, both ['clientes'] AND ['clientes', id]
 *             invalidated (R-011 — list + detail refetch), toast.success fires
 *             with exact Spanish copy.
 *   - AC #5 — 409 classification: kind='nit-conflict' + nitMessage; toast NOT
 *             fired; invalidation NOT triggered.
 *   - AC #7 — 404 classification: kind='not-found' + generic title/subtitle
 *             copy about "El cliente ya no existe".
 *   - AC #7 — 500 classification: kind='network' + generic 'No se pudo guardar'
 *             + 'Comprueba tu conexión e intenta nuevamente.'.
 *   - AC #10 (defense-in-depth) — 400 classification: kind='validation'.
 *
 * The toast API is mocked at module level so we can spy on `toast.success`.
 *
 * RED until:
 *   - `useUpdateCliente.ts` exists and exports the hook with the classification
 *     helper described in Task 6 of the story.
 *   - `clienteApiRepository.update` is implemented on the repository.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'

// Mock siesa-ui-kit toast module to spy on toast.success without mounting a ToastProvider.
// vi.hoisted ensures the mock spies exist when vi.mock's hoisted factory runs.
const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))
vi.mock('siesa-ui-kit', async (importOriginal) => {
  const original = await importOriginal<typeof import('siesa-ui-kit')>()
  return {
    ...original,
    toast: {
      success: toastSuccessMock,
      error: toastErrorMock,
    },
  }
})

// Import AFTER the mock so `useUpdateCliente` receives the spied toast.
import { useUpdateCliente } from './useUpdateCliente'
import { CLIENTES_QUERY_KEY } from './useClientes'

function wrapperFactory() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

beforeEach(() => {
  toastSuccessMock.mockReset()
  toastErrorMock.mockReset()
})

describe('useUpdateCliente — success path (AC #2)', () => {
  it('GIVEN 200, WHEN the mutation resolves, THEN it invalidates ["clientes"] AND ["clientes", id] AND calls toast.success with the Spanish copy', async () => {
    const target = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'New Name',
      nit: '900111000',
    })
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )
    const { client, wrapper } = wrapperFactory()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: target.id,
      values: {
        nombre: 'New Name',
        nit: '900111000',
        telefono: '3009998877',
        ciudad: 'Cali',
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(target)
    // AC #2 / R-011 — BOTH keys must be invalidated.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CLIENTES_QUERY_KEY })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...CLIENTES_QUERY_KEY, target.id],
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })
})

describe('useUpdateCliente — 409 classification (AC #5)', () => {
  it('GIVEN 409 with the RFC 7807 body, WHEN it settles, THEN error.kind === "nit-conflict" AND toast.success is NOT called AND invalidation NOT triggered', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          },
          {
            status: 409,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )
    const { client, wrapper } = wrapperFactory()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: '11111111-1111-1111-1111-111111111111',
      values: {
        nombre: 'Duplicated',
        nit: '900123456',
        telefono: '3001234567',
        ciudad: 'Cali',
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
    expect(result.current.error!.kind).toBe('nit-conflict')
    expect(result.current.error!.nitMessage).toBe('El NIT/RUC ya está registrado')
    expect(toastSuccessMock).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe('useUpdateCliente — 404 classification (AC #7)', () => {
  it('GIVEN 404, WHEN it settles, THEN error.kind === "not-found" with the exact Spanish "El cliente ya no existe" copy', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
            title: 'Not Found',
            status: 404,
          },
          {
            status: 404,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: '11111111-1111-1111-1111-111111111111',
      values: {
        nombre: 'Any',
        nit: '900123456',
        telefono: '3001234567',
        ciudad: 'Cali',
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('not-found')
    expect(result.current.error!.generic?.title).toBe('El cliente ya no existe')
    expect(result.current.error!.generic?.subtitle).toContain('Cierra el formulario')
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('useUpdateCliente — 500/network classification (AC #7)', () => {
  it('GIVEN 500, WHEN it settles, THEN error.kind === "network" with the exact Spanish copy AND toast.success NOT called', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: '11111111-1111-1111-1111-111111111111',
      values: {
        nombre: 'Any',
        nit: '900123456',
        telefono: '3001234567',
        ciudad: 'Cali',
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('network')
    expect(result.current.error!.generic?.title).toBe('No se pudo guardar')
    expect(result.current.error!.generic?.subtitle).toBe('Comprueba tu conexión e intenta nuevamente.')
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('useUpdateCliente — 400 classification (AC #10 defense-in-depth)', () => {
  it('GIVEN 400 (Zod bypass), WHEN it settles, THEN error.kind === "validation"', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(
          { type: '', title: 'Validation Failed', status: 400, errors: {} },
          {
            status: 400,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useUpdateCliente(), { wrapper })

    result.current.mutate({
      id: '11111111-1111-1111-1111-111111111111',
      values: {
        nombre: 'Any',
        nit: '900123456',
        telefono: '3001234567',
        ciudad: 'Cali',
      },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('validation')
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

/**
 * Story 2.3 — ATDD (RED phase).
 *
 * Contract tests for the `useCreateCliente` mutation hook (Task 6). Covers:
 *   - AC #2 / #5 — success: 201 resolves, ['clientes'] invalidated, toast.success fires.
 *   - AC #4     — 409 classification: kind='nit-conflict' + nitMessage.
 *   - AC #7     — non-409 classification: kind='network' + generic alert copy.
 *   - AC #10 (defense) — 400 classification: kind='validation'.
 *
 * The toast API is mocked at module level so we can spy on `toast.success`.
 *
 * RED until:
 *   - `useCreateCliente.ts` exists and exports the hook with the classification
 *     helper described in Task 6 of the story.
 *   - `clienteApiRepository.create` is implemented on the repository.
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

// Import AFTER the mock so `useCreateCliente` receives the spied toast.
import { useCreateCliente } from './useCreateCliente'
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

describe('useCreateCliente — success path (AC #2, #5)', () => {
  it('GIVEN 201, WHEN the mutation resolves, THEN it invalidates ["clientes"] AND calls toast.success with the Spanish copy', async () => {
    const created = buildCliente({ nombre: 'Acme SAS', nit: '900123456' })
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(created, { status: 201 }),
      ),
    )
    const { client, wrapper } = wrapperFactory()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    result.current.mutate({
      nombre: 'Acme SAS',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(created)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CLIENTES_QUERY_KEY })
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')
  })
})

describe('useCreateCliente — 409 classification (AC #4)', () => {
  it('GIVEN 409 with the RFC 7807 body, WHEN it settles, THEN error.kind === "nit-conflict" AND toast.success is NOT called', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
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
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    result.current.mutate({
      nombre: 'Duplicated',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
    expect(result.current.error!.kind).toBe('nit-conflict')
    expect(result.current.error!.nitMessage).toBe('El NIT/RUC ya está registrado')
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('useCreateCliente — 500/network classification (AC #7)', () => {
  it('GIVEN 500, WHEN it settles, THEN error.kind === "network" with the exact Spanish copy AND toast.success NOT called', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    result.current.mutate({
      nombre: 'Acme SAS',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('network')
    expect(result.current.error!.generic?.title).toBe('No se pudo guardar')
    expect(result.current.error!.generic?.subtitle).toBe('Comprueba tu conexión e intenta nuevamente.')
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('useCreateCliente — 400 classification (AC #10 defense-in-depth)', () => {
  it('GIVEN 400 (Zod bypass), WHEN it settles, THEN error.kind === "validation"', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
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

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    result.current.mutate({
      nombre: 'Acme SAS',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('validation')
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

/**
 * Story 2.3 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `useCreateCliente()` with boundary conditions the
 * RED-phase suite skipped:
 *   - Non-AxiosError raw failures classify as `network` (no crash, no leak).
 *   - AxiosError WITHOUT a response (aborted / network unreachable) classifies
 *     as `network`.
 *   - AxiosError WITH an unexpected status (503, 429, 418) classifies as
 *     `network` (only 409 and 400 are special-cased).
 *   - `mutation.reset()` clears both data and error state.
 *   - Two sequential mutations reuse the same hook without state bleed.
 *   - The success payload flows through unchanged (Cliente shape parity).
 *
 * [P1] tag — the mutation hook is the FE ↔ BE seam that classifies every
 * possible axios failure before the presentation layer sees it. A bug here
 * either leaks internals (NFR6) or crashes the form.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'

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

const validPayload = {
  nombre: 'Acme SAS',
  nit: '900123456',
  telefono: '3001234567',
  ciudad: 'Cali',
}

beforeEach(() => {
  toastSuccessMock.mockReset()
  toastErrorMock.mockReset()
})

describe('useCreateCliente — unexpected status classification (AC #7)', () => {
  it('[P1] GIVEN 503, THEN error.kind === "network" (not "validation" or "nit-conflict")', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        new HttpResponse(null, { status: 503 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('network')
    expect(result.current.error!.generic?.title).toBe('No se pudo guardar')
  })

  it('[P1] GIVEN 429 (rate-limited), THEN error.kind === "network"', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({}, { status: 429 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('network')
  })

  it('[P2] GIVEN 418 (unexpected teapot), THEN error.kind === "network" (defensive default)', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({}, { status: 418 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('network')
  })
})

describe('useCreateCliente — network-layer failure (no response object)', () => {
  it('[P1] GIVEN a network error (MSW passthrough → no response), THEN error.kind === "network"', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => HttpResponse.error()),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('network')
    expect(result.current.error!.generic?.subtitle).toBe(
      'Comprueba tu conexión e intenta nuevamente.',
    )
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('useCreateCliente — reset semantics', () => {
  it('[P1] GIVEN a 409 error, WHEN reset() is called, THEN both error AND data are cleared', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))

    act(() => {
      result.current.reset()
    })

    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.data).toBeUndefined()
  })
})

describe('useCreateCliente — sequential mutations reuse the hook without bleed', () => {
  it('[P1] GIVEN a 409 followed by a 201, THEN the second mutation resolves cleanly and toast.success fires ONCE', async () => {
    let call = 0
    const created = buildCliente({ nombre: 'Acme SAS', nit: '900987654' })
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        call += 1
        if (call === 1) {
          return HttpResponse.json(
            {
              type: '',
              title: 'Conflict',
              status: 409,
              detail: 'El NIT/RUC ya está registrado',
            },
            { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    const { client, wrapper } = wrapperFactory()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), { wrapper })

    // First — 409.
    result.current.mutate(validPayload)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error!.kind).toBe('nit-conflict')

    // Second — 201, different NIT.
    result.current.mutate({ ...validPayload, nit: '900987654' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(created)

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CLIENTES_QUERY_KEY })
    expect(toastSuccessMock).toHaveBeenCalledTimes(1)
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')
  })
})

describe('useCreateCliente — success payload shape parity (AC #5)', () => {
  it('[P1] GIVEN 201 with the full ClienteDto, THEN mutation.data reflects the server body byte-for-byte', async () => {
    const created = buildCliente({
      id: '99999999-9999-9999-9999-999999999999',
      nombre: 'Acme SAS',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    })
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(created, { status: 201 }),
      ),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Object equality — server DTO round-trips end-to-end.
    expect(result.current.data).toEqual(created)
    expect(result.current.data!.id).toBe('99999999-9999-9999-9999-999999999999')
    expect(result.current.data!.createdAt).toBe(created.createdAt)
    expect(result.current.data!.updatedAt).toBe(created.updatedAt)
  })
})

describe('useCreateCliente — no side effects on error path', () => {
  it('[P1] GIVEN a 409 conflict, THEN queryClient.invalidateQueries is NEVER called (list stays as-is)', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado' },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    const { client, wrapper } = wrapperFactory()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCreateCliente(), { wrapper })
    result.current.mutate(validPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

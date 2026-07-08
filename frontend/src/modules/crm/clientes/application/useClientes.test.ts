/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Covers AC #1 (list is fetched from `GET /api/v1/clientes`) and the caching
 * contract required by AC #2 (search must NOT fire additional requests when
 * the query is already resolved — verified indirectly here by asserting no
 * refetch is issued while data is fresh).
 *
 * RED until the following files exist:
 *   - src/modules/crm/clientes/application/useClientes.ts
 *   - src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
 *   - src/modules/crm/clientes/domain/Cliente.ts
 */
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { createTestQueryClient } from '@/test/render'
import { buildClientes } from '@/test/factories/cliente.factory'
import { CLIENTES_QUERY_KEY, useClientes } from './useClientes'

function wrapperFactory() {
  const client = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

describe('useClientes hook', () => {
  it('GIVEN backend returns 3 clientes, WHEN hook resolves, THEN data has length 3', async () => {
    const fixture = buildClientes(3)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
  })

  it('GIVEN backend returns 500, WHEN hook resolves, THEN isError is true', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json({}, { status: 500 })),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('GIVEN the query resolved once, WHEN a re-render happens, THEN no additional MSW request is fired (AC #2 client-side filter)', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        calls += 1
        return HttpResponse.json(buildClientes(1), { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result, rerender } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender()
    rerender()

    expect(calls).toBe(1)
  })

  it('GIVEN a consumer, THEN the exported query key is the canonical ["clientes"] tuple', () => {
    expect(CLIENTES_QUERY_KEY).toEqual(['clientes'])
  })
})

/**
 * Story 2.1 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `useClientes` with boundary conditions:
 *   * Empty backend response resolves with data = [] (AC #4).
 *   * Two concurrent hook consumers share the same in-flight request (dedup).
 *   * No automatic retry on failure (test QueryClient has retry: false —
 *     verifies the hook does not override it).
 *   * Query state transitions: isPending → isSuccess.
 *
 * [P1] tag — the fetch layer is on the critical path.
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
import { useClientes } from './useClientes'

function wrapperFactory() {
  const client = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

describe('useClientes — edge cases', () => {
  it('GIVEN backend returns [], WHEN the hook resolves, THEN data is an empty array (not undefined)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('GIVEN two concurrent consumers, WHEN both mount, THEN only ONE HTTP request is issued', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        calls += 1
        return HttpResponse.json(buildClientes(2), { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result: r1 } = renderHook(() => useClientes(), { wrapper })
    const { result: r2 } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => {
      expect(r1.current.isSuccess).toBe(true)
      expect(r2.current.isSuccess).toBe(true)
    })

    expect(calls).toBe(1)
    expect(r1.current.data).toBe(r2.current.data)
  })

  it('GIVEN the initial mount, WHEN the request is pending, THEN isPending is true and data is undefined', () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        // Never resolve; we only assert the initial state.
        await new Promise(() => {})
        return HttpResponse.json([], { status: 200 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useClientes(), { wrapper })

    expect(result.current.isPending).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('GIVEN backend returns 404, WHEN the hook resolves, THEN isError is true and no retry storms happen', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        calls += 1
        return HttpResponse.json({}, { status: 404 })
      }),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // createTestQueryClient() sets retry: false — assert no automatic retries.
    expect(calls).toBe(1)
  })

  it('GIVEN a large 500-item response, WHEN the hook resolves, THEN all items are exposed via data', async () => {
    const fixture = buildClientes(500)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )
    const { wrapper } = wrapperFactory()

    const { result } = renderHook(() => useClientes(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(500)
  })
})

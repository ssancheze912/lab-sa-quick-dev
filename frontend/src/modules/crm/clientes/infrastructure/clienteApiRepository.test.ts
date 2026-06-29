/**
 * Story 2.1 — clienteApiRepository edge-case automation expansion.
 *
 * The ATDD layer already covers the happy path through useClientes; this file
 * exercises the repository directly so the search-param contract and error
 * propagation are pinned by a unit-level test that doesn't depend on React Query.
 *
 * Coverage:
 *   [P2] getAll() with no arg → no `search` query param is sent
 *   [P2] getAll('acme') → request URL contains `search=acme`
 *   [P2] getAll('') → falsy search ⇒ no `search` query param sent (per implementation)
 *   [P2] HTTP 500 is propagated as a rejected promise (no swallowing)
 */
import { describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'

import { server } from '@/mocks/server'
import { buildClienteFixture } from '@/mocks/handlers/clientes'
import { clienteApiRepository } from './clienteApiRepository'

describe('clienteApiRepository — repository contract', () => {
  test('[P2] getAll() without args fires GET with NO search query param', async () => {
    // GIVEN: spy capturing the search query value
    let capturedSearch: string | null | undefined = undefined
    server.use(
      http.get('*/api/v1/clientes', ({ request }) => {
        capturedSearch = new URL(request.url).searchParams.get('search')
        return HttpResponse.json([buildClienteFixture()])
      }),
    )

    // WHEN
    await clienteApiRepository.getAll()

    // THEN: search param was absent
    expect(capturedSearch).toBeNull()
  })

  test('[P2] getAll("acme") forwards the search param verbatim', async () => {
    let capturedSearch: string | null = null
    server.use(
      http.get('*/api/v1/clientes', ({ request }) => {
        capturedSearch = new URL(request.url).searchParams.get('search')
        return HttpResponse.json([])
      }),
    )

    await clienteApiRepository.getAll('acme')

    expect(capturedSearch).toBe('acme')
  })

  test('[P2] getAll("") (empty string) does NOT add a search query param', async () => {
    // The implementation uses `search ? { search } : undefined` so the empty
    // string is falsy and the param is omitted. Pin that contract here.
    let capturedSearch: string | null | undefined = undefined
    server.use(
      http.get('*/api/v1/clientes', ({ request }) => {
        capturedSearch = new URL(request.url).searchParams.get('search')
        return HttpResponse.json([])
      }),
    )

    await clienteApiRepository.getAll('')

    expect(capturedSearch).toBeNull()
  })

  test('[P2] returns the response body as an array', async () => {
    const a = buildClienteFixture({ nombre: 'A' })
    const b = buildClienteFixture({ nombre: 'B' })
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([a, b])))

    const result = await clienteApiRepository.getAll()

    expect(result).toHaveLength(2)
    expect(result[0]?.nombre).toBe('A')
    expect(result[1]?.nombre).toBe('B')
  })

  test('[P2] HTTP 500 is surfaced as a rejected promise', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Error', status: 500 },
          { status: 500 },
        ),
      ),
    )

    await expect(clienteApiRepository.getAll()).rejects.toThrow()
  })

  test('[P2] HTTP 404 is surfaced as a rejected promise', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => new HttpResponse(null, { status: 404 })),
    )

    await expect(clienteApiRepository.getAll()).rejects.toThrow()
  })
})

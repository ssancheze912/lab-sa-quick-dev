/**
 * Story 2.2 — clienteApiRepository infrastructure EDGE CASES (Automate expansion)
 * Epic 2: Client Management
 *
 * Direct unit tests for the Axios-backed `IClienteRepository` implementation.
 * ATDD coverage exercises the repository indirectly through `useCliente`; this
 * suite validates the infrastructure-layer contract in isolation:
 *
 *   • [P1] getById issues a GET to `/api/v1/clientes/{id}` (URL template — no
 *     concatenation drift, no missing slash, no double slash).
 *   • [P1] getById returns the parsed JSON payload verbatim.
 *   • [P1] getById propagates Axios errors on 404 (caller-visible reject).
 *   • [P1] getById propagates Axios errors on 500 (branch discriminator).
 *   • [P1] getById forwards the AbortSignal to Axios (request cancellation
 *     on unmount / navigation).
 *   • [P2] getAll still works after the interface extension (regression guard).
 *   • [P2] URL-safe ids with dashes are transmitted unchanged (no encoding
 *     drift on standard GUID shape).
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AxiosError } from 'axios'

import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository'
import {
  clientesHandlers,
  makeCliente,
  resetClienteFactoryCounter,
} from '@/test/handlers/clientes'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first (handlers registered per-test)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetClienteFactoryCounter()
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] getById — happy path: correct URL + payload passthrough
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] clienteApiRepository.getById — URL & payload', () => {
  it('[P1] should GET /api/v1/clientes/{id} with the exact id in the path', async () => {
    // GIVEN: A URL-observing MSW handler
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000010001',
    })
    let observedUrl: string | undefined
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, ({ request }) => {
        observedUrl = new URL(request.url).pathname
        return HttpResponse.json(cliente)
      }),
    )

    // WHEN: The repository fetches by id
    await clienteApiRepository.getById(cliente.id)

    // THEN: The path segment ends with /api/v1/clientes/{id} verbatim
    expect(observedUrl).toBe(`/api/v1/clientes/${cliente.id}`)
  })

  it('[P1] should return the parsed cliente payload verbatim', async () => {
    // GIVEN: MSW serves a fully-populated cliente
    const cliente = makeCliente({
      id: '00000000-0000-4000-8000-000000010002',
      nombre: 'Cliente Repo Test',
      nitRuc: '900-100-100',
      telefono: '3009998877',
      ciudad: 'Cartagena',
    })
    server.use(clientesHandlers.byId(cliente))

    // WHEN: The repository fetches by id
    const result = await clienteApiRepository.getById(cliente.id)

    // THEN: Every field survives the round-trip
    expect(result.id).toBe(cliente.id)
    expect(result.nombre).toBe('Cliente Repo Test')
    expect(result.nitRuc).toBe('900-100-100')
    expect(result.telefono).toBe('3009998877')
    expect(result.ciudad).toBe('Cartagena')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] getById — error propagation (AxiosError with .response.status)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] clienteApiRepository.getById — error propagation', () => {
  it('[P1] should reject with an AxiosError on 404 (useCliente uses response.status)', async () => {
    // GIVEN: MSW returns 404 for the requested id
    server.use(clientesHandlers.byIdNotFound())

    // WHEN / THEN: The promise rejects with an AxiosError whose response.status
    //              is 404 — this is the exact discriminator `isClienteNotFound`
    //              relies on.
    await expect(
      clienteApiRepository.getById('00000000-0000-0000-0000-000000000000'),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof AxiosError &&
        error.response?.status === 404
      )
    })
  })

  it('[P1] should reject with an AxiosError on 500 (distinct from 404)', async () => {
    // GIVEN: MSW returns 500
    server.use(clientesHandlers.byIdError(500))

    // WHEN / THEN: The promise rejects and response.status !== 404
    await expect(
      clienteApiRepository.getById('00000000-0000-4000-8000-000000020500'),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof AxiosError &&
        error.response?.status === 500 &&
        error.response.status !== 404
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] getById — AbortSignal propagation (TanStack Query cancellation)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] clienteApiRepository.getById — AbortSignal propagation', () => {
  it('[P1] should abort the request when the provided AbortSignal is aborted', async () => {
    // GIVEN: A slow MSW handler that never resolves before we abort
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return HttpResponse.json({})
      }),
    )

    // WHEN: The repo is invoked with a signal that aborts immediately
    const controller = new AbortController()
    const promise = clienteApiRepository.getById(
      '00000000-0000-4000-8000-000000030001',
      controller.signal,
    )
    // Abort BEFORE MSW replies — Axios must translate the abort into a reject
    controller.abort()

    // THEN: The promise rejects with a cancel/abort-shaped error
    //       (Axios wraps abort as an AxiosError with code === 'ERR_CANCELED')
    await expect(promise).rejects.toSatisfy((error: unknown) => {
      if (!(error instanceof Error)) return false
      const anyErr = error as { code?: string; message?: string; name?: string }
      return (
        anyErr.code === 'ERR_CANCELED' ||
        /canceled/i.test(anyErr.message ?? '') ||
        anyErr.name === 'CanceledError' ||
        anyErr.name === 'AbortError'
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] getAll — regression guard after the interface extension in Story 2.2
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] clienteApiRepository.getAll — regression after Story 2.2 interface change', () => {
  it('[P2] should still return the list array unchanged (Story 2.1 contract)', async () => {
    // GIVEN: MSW serves a two-item list
    const list = [
      makeCliente({ id: '00000000-0000-4000-8000-000000090001' }),
      makeCliente({ id: '00000000-0000-4000-8000-000000090002' }),
    ]
    server.use(clientesHandlers.list(list))

    // WHEN: getAll is invoked (no arguments — signal is optional)
    const result = await clienteApiRepository.getAll()

    // THEN: The array survives verbatim — Story 2.1 behaviour intact
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(list[0].id)
    expect(result[1].id).toBe(list[1].id)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] URL construction — dashes / GUID shape survive the template literal
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] clienteApiRepository.getById — GUID URL construction', () => {
  it('[P2] should transmit standard-shape GUID ids unchanged (no encoding drift)', async () => {
    // GIVEN: A canonical GUID string with dashes
    const canonicalGuid = '12345678-90ab-4cde-8f01-234567890abc'
    let observedUrl: string | undefined
    server.use(
      http.get(`*/api/v1/clientes/${canonicalGuid}`, ({ request }) => {
        observedUrl = new URL(request.url).pathname
        return HttpResponse.json(makeCliente({ id: canonicalGuid }))
      }),
    )

    // WHEN: The repo is invoked with the canonical guid
    await clienteApiRepository.getById(canonicalGuid)

    // THEN: The dashes survive intact — no percent-encoding, no double-slash
    expect(observedUrl).toBe(`/api/v1/clientes/${canonicalGuid}`)
    expect(observedUrl).not.toContain('%2D') // dashes NOT percent-encoded
    expect(observedUrl).not.toMatch(/\/\//)
  })
})

/**
 * Story 2.1 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `clienteApiRepository`:
 *   * `getById` targets the correct URL and returns the payload (declared now
 *     for Story 2.2 reuse per Task 6 — the contract must already work).
 *   * AbortSignal is honoured: cancelling the signal rejects the in-flight
 *     promise.
 *   * 404 status maps to a rejection.
 *   * Query parameters (if any consumer accidentally passes them) do NOT
 *     appear on the URL — Story 2.1 has ZERO query params.
 *
 * [P1] tag — infrastructure layer: silent bugs here become integration bugs.
 */
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'
import { clienteApiRepository } from './clienteApiRepository'

describe('clienteApiRepository — edge cases', () => {
  it('GIVEN backend responds 404, WHEN getAll is called, THEN the promise rejects', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json({}, { status: 404 })),
    )

    await expect(clienteApiRepository.getAll()).rejects.toBeDefined()
  })

  it('GIVEN an aborted AbortSignal, WHEN getAll is called, THEN the promise rejects with a cancel-like error', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, async () => {
        await new Promise((r) => setTimeout(r, 500))
        return HttpResponse.json([], { status: 200 })
      }),
    )

    const controller = new AbortController()
    const promise = clienteApiRepository.getAll(controller.signal)
    controller.abort()

    await expect(promise).rejects.toBeDefined()
  })

  it('GIVEN a well-formed getById call, WHEN backend responds 200, THEN the parsed cliente is returned', async () => {
    const cliente = buildCliente({ nombre: 'Empresa By Id' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 }),
      ),
    )

    const result = await clienteApiRepository.getById(cliente.id)

    expect(result).toEqual(cliente)
  })

  it('GIVEN a getById call, THEN the URL includes the id as a path segment', async () => {
    let capturedPath = ''
    const cliente = buildCliente()
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, ({ request }) => {
        capturedPath = new URL(request.url).pathname
        return HttpResponse.json(cliente, { status: 200 })
      }),
    )

    await clienteApiRepository.getById(cliente.id)

    expect(capturedPath).toBe(`/api/v1/clientes/${cliente.id}`)
  })

  it('GIVEN a getAll call, THEN the request URL carries NO query string (Story 2.1 has zero query params)', async () => {
    let capturedSearch = ''
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, ({ request }) => {
        capturedSearch = new URL(request.url).search
        return HttpResponse.json([], { status: 200 })
      }),
    )

    await clienteApiRepository.getAll()

    expect(capturedSearch).toBe('')
  })

  it('GIVEN a getAll call, THEN the HTTP method is GET (no accidental POST)', async () => {
    let capturedMethod = ''
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, ({ request }) => {
        capturedMethod = request.method
        return HttpResponse.json([], { status: 200 })
      }),
    )

    await clienteApiRepository.getAll()

    expect(capturedMethod).toBe('GET')
  })

  it('GIVEN backend responds with a 500 error, WHEN getById is called, THEN the promise rejects', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => HttpResponse.json({}, { status: 500 })),
    )

    await expect(clienteApiRepository.getById('some-id')).rejects.toBeDefined()
  })
})

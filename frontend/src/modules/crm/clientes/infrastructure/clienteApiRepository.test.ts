/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Covers AC #1, #8 — the frontend infrastructure adapter that calls
 * `GET /api/v1/clientes` and returns a `Cliente[]`.
 *
 * RED until:
 *   - src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
 *   - src/modules/crm/clientes/domain/Cliente.ts
 * exist.
 */
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente, buildClientes } from '@/test/factories/cliente.factory'
import { clienteApiRepository } from './clienteApiRepository'

describe('clienteApiRepository', () => {
  it('GIVEN backend returns a well-formed array, WHEN getAll is called, THEN the same array is resolved', async () => {
    const fixture = buildClientes(2)
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json(fixture, { status: 200 })),
    )

    const result = await clienteApiRepository.getAll()

    expect(result).toEqual(fixture)
  })

  it('GIVEN a getAll call, THEN the request targets exactly `/api/v1/clientes`', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, ({ request }) => {
        capturedUrl = new URL(request.url).pathname
        return HttpResponse.json([], { status: 200 })
      }),
    )

    await clienteApiRepository.getAll()

    expect(capturedUrl).toBe('/api/v1/clientes')
  })

  it('GIVEN backend responds 500, WHEN getAll is called, THEN the promise rejects', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json({}, { status: 500 })),
    )

    await expect(clienteApiRepository.getAll()).rejects.toBeDefined()
  })

  it('GIVEN a Cliente shape, THEN getAll returns objects with the expected keys', async () => {
    const one = buildCliente()
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([one], { status: 200 })),
    )

    const [received] = await clienteApiRepository.getAll()

    expect(received).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nombre: expect.any(String),
        nit: expect.any(String),
        telefono: expect.any(String),
        ciudad: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    )
  })
})

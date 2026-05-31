/**
 * Unit Tests — clienteApiRepository
 *
 * Covers:
 *   - getAll() calls GET /api/v1/clientes
 *   - getAll() returns the response data array (typed as Cliente[])
 *   - getAll() propagates network error
 *   - getAll() propagates 500 server error
 *   - Returns empty array when API returns []
 *   - Response data is returned without transformation
 *
 * Pattern: Vitest + MSW (intercepts Axios requests)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { clienteApiRepository } from '../clienteApiRepository'
import type { Cliente } from '../../domain/Cliente'

const API_URL = 'http://localhost:5000'

const twoClientes: Cliente[] = [
  {
    id: 'aaa00000-0000-0000-0000-000000000001',
    nombre: 'Empresa Alpha',
    nit: '111000111-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'bbb00000-0000-0000-0000-000000000002',
    nombre: 'Beta Corp',
    nit: '222333444-2',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
  },
]

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('clienteApiRepository.getAll()', () => {
  it('Returns the array of clients from GET /api/v1/clientes', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const result = await clienteApiRepository.getAll()

    expect(result).toHaveLength(2)
    expect(result[0].nombre).toBe('Empresa Alpha')
    expect(result[1].nombre).toBe('Beta Corp')
  })

  it('Returns an empty array when API returns []', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json([], { status: 200 })
      )
    )

    const result = await clienteApiRepository.getAll()

    expect(result).toHaveLength(0)
    expect(Array.isArray(result)).toBe(true)
  })

  it('Returns data with all required Cliente fields', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const result = await clienteApiRepository.getAll()
    const first = result[0]

    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('nombre')
    expect(first).toHaveProperty('nit')
    expect(first).toHaveProperty('telefono')
    expect(first).toHaveProperty('ciudad')
    expect(first).toHaveProperty('createdAt')
    expect(first).toHaveProperty('updatedAt')
  })

  it('Returns data untransformed — id is the original UUID string', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const result = await clienteApiRepository.getAll()

    expect(result[0].id).toBe('aaa00000-0000-0000-0000-000000000001')
    expect(result[1].id).toBe('bbb00000-0000-0000-0000-000000000002')
  })

  it('Returns createdAt and updatedAt as ISO 8601 strings', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json(twoClientes, { status: 200 })
      )
    )

    const result = await clienteApiRepository.getAll()

    expect(result[0].createdAt).toBe('2026-05-01T10:00:00Z')
    expect(result[0].updatedAt).toBe('2026-05-01T10:00:00Z')
  })

  it('Throws when API returns a network error', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () => HttpResponse.error())
    )

    await expect(clienteApiRepository.getAll()).rejects.toThrow()
  })

  it('Throws when API returns HTTP 500', async () => {
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, () =>
        HttpResponse.json({ title: 'Internal Server Error' }, { status: 500 })
      )
    )

    await expect(clienteApiRepository.getAll()).rejects.toThrow()
  })

  it('Calls the correct endpoint path /api/v1/clientes', async () => {
    let interceptedUrl = ''
    server.use(
      http.get(`${API_URL}/api/v1/clientes`, ({ request }) => {
        interceptedUrl = request.url
        return HttpResponse.json(twoClientes, { status: 200 })
      })
    )

    await clienteApiRepository.getAll()

    expect(interceptedUrl).toContain('/api/v1/clientes')
  })
})

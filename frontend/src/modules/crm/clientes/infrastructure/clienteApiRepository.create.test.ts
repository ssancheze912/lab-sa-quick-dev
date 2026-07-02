// -----------------------------------------------------------------------------
// Story 2.3 — Create Client
// Unit tests for clienteApiRepository.create — proves axios wiring / URL /
// error propagation independent of TanStack Query state.
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import type { AxiosError } from 'axios'
import { server } from '@/test/msw/server'
import { clienteApiRepository } from './clienteApiRepository'

const validPayload = {
  nombre: 'Nuevo Cliente SA',
  nit: '999888777-1',
  telefono: '+57 300 555 0000',
  ciudad: 'Medellín',
}

describe('clienteApiRepository.create', () => {
  it('returns the created Cliente on 201', async () => {
    const created = await clienteApiRepository.create(validPayload)
    expect(created.id).toBeTruthy()
    expect(created.nombre).toBe(validPayload.nombre)
    expect(created.nit).toBe(validPayload.nit)
    expect(created.telefono).toBe(validPayload.telefono)
    expect(created.ciudad).toBe(validPayload.ciudad)
    expect(typeof created.createdAt).toBe('string')
  })

  it('rejects with AxiosError.response.status === 400 on validation error', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
            title: 'Uno o más campos son inválidos.',
            status: 400,
            errors: { nombre: ['El nombre es requerido.'] },
          },
          { status: 400 },
        ),
      ),
    )

    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.create({ ...validPayload, nombre: '' })
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(400)
  })

  it('rejects with AxiosError.response.status === 409 for duplicate NIT', async () => {
    // Default MSW handler already returns 409 when the NIT collides with a seed cliente.
    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.create({ ...validPayload, nit: '900123456-7' })
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(409)
    const body = caught?.response?.data as { title?: string }
    expect(body?.title).toBe('NIT/RUC duplicado')
  })

  it('rejects with AxiosError.response.status === 500 on server error', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.create(validPayload)
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(500)
  })

  it('targets exactly POST /api/v1/clientes and sends the JSON body', async () => {
    let capturedMethod: string | null = null
    let capturedPath: string | null = null
    let capturedBody: unknown = null
    server.use(
      http.post('*/api/v1/clientes', async ({ request }) => {
        capturedMethod = request.method
        capturedPath = new URL(request.url).pathname
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: '00000000-0000-0000-0000-000000000001',
            ...(capturedBody as object),
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T12:00:00Z',
          },
          { status: 201 },
        )
      }),
    )

    await clienteApiRepository.create(validPayload)

    expect(capturedMethod).toBe('POST')
    expect(capturedPath).toBe('/api/v1/clientes')
    expect(capturedBody).toEqual(validPayload)
  })
})

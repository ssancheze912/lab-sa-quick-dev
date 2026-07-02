// -----------------------------------------------------------------------------
// Story 2.4 — Edit Client
// Unit tests for clienteApiRepository.update — proves axios wiring / URL /
// error propagation independent of TanStack Query state.
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import type { AxiosError } from 'axios'
import { server } from '@/test/msw/server'
import { clienteApiRepository } from './clienteApiRepository'

const seedId = '11111111-1111-1111-1111-111111111111'

const validPayload = {
  nombre: 'Acme Updated',
  nit: '900123456-7',
  telefono: '+57 300 555 0000',
  ciudad: 'Medellín',
}

describe('clienteApiRepository.update', () => {
  it('returns the updated Cliente on 200', async () => {
    const updated = await clienteApiRepository.update(seedId, validPayload)
    expect(updated.id).toBe(seedId)
    expect(updated.nombre).toBe(validPayload.nombre)
    expect(updated.nit).toBe(validPayload.nit)
    expect(updated.telefono).toBe(validPayload.telefono)
    expect(updated.ciudad).toBe(validPayload.ciudad)
    expect(typeof updated.createdAt).toBe('string')
    expect(typeof updated.updatedAt).toBe('string')
  })

  it('rejects with AxiosError.response.status === 400 on validation error', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
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
      await clienteApiRepository.update(seedId, { ...validPayload, nombre: '' })
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(400)
  })

  it('rejects with AxiosError.response.status === 404 for unknown id', async () => {
    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.update(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        validPayload,
      )
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(404)
    const body = caught?.response?.data as { title?: string }
    expect(body?.title).toBe('Cliente no encontrado')
  })

  it('rejects with AxiosError.response.status === 409 for duplicate NIT (different row)', async () => {
    // Seed has cliente 22222222-... with nit 800987654-3. PUT the id 11111111
    // with that NIT collides against a DIFFERENT row → 409.
    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.update(seedId, {
        ...validPayload,
        nit: '800987654-3',
      })
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(409)
    const body = caught?.response?.data as { title?: string; field?: string }
    expect(body?.title).toBe('NIT/RUC duplicado')
    expect(body?.field).toBe('nit')
  })

  it('rejects with AxiosError.response.status === 500 on server error', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.update(seedId, validPayload)
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(500)
  })

  it('targets exactly PUT /api/v1/clientes/:id and sends the JSON body', async () => {
    let capturedMethod: string | null = null
    let capturedPath: string | null = null
    let capturedBody: unknown = null
    server.use(
      http.put('*/api/v1/clientes/:id', async ({ request }) => {
        capturedMethod = request.method
        capturedPath = new URL(request.url).pathname
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: seedId,
            ...(capturedBody as object),
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T13:00:00Z',
          },
          { status: 200 },
        )
      }),
    )

    await clienteApiRepository.update(seedId, validPayload)

    expect(capturedMethod).toBe('PUT')
    expect(capturedPath).toBe(`/api/v1/clientes/${seedId}`)
    expect(capturedBody).toEqual(validPayload)
  })
})

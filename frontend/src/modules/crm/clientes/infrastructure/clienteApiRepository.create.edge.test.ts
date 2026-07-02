// -----------------------------------------------------------------------------
// Story 2.3 — Create Client (BMad-Integrated automate expansion)
// Edge-case tests for clienteApiRepository.create.
//
// The baseline suite (clienteApiRepository.create.test.ts) covers 201/400/409/500
// happy and error paths + URL/method/body verification. This file focuses on
// runtime concerns the baseline does not:
//   - AbortSignal → axios cancels the request (React Query calls this on unmount).
//   - Optional Location header on 201 does not break the DTO parse.
//   - Non-2xx responses without a JSON body still surface as AxiosError.
//   - 4xx variants other than 400/409/429 propagate their status verbatim.
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import type { AxiosError } from 'axios'
import { server } from '@/test/msw/server'
import { clienteApiRepository } from './clienteApiRepository'

const validPayload = {
  nombre: 'Edge API Cliente',
  nit: '888-edge',
  telefono: '+57 300 999 8888',
  ciudad: 'Bogotá',
}

describe('clienteApiRepository.create — AbortSignal', () => {
  it('[P1] aborts the request when the signal is triggered before completion', async () => {
    server.use(
      http.post('*/api/v1/clientes', async () => {
        // Delay the server response so the abort has time to fire client-side.
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ id: 'x' }, { status: 201 })
      }),
    )

    const controller = new AbortController()
    const promise = clienteApiRepository.create(validPayload, controller.signal)
    controller.abort()

    let caught: unknown
    try {
      await promise
    } catch (e) {
      caught = e
    }
    expect(caught).toBeDefined()
    // Axios surfaces either a CanceledError (name 'CanceledError') or an
    // AbortError depending on the underlying transport. Either signals abort.
    const err = caught as { name?: string; code?: string; message?: string }
    const name = err?.name ?? ''
    const code = err?.code ?? ''
    const msg = err?.message ?? ''
    expect(
      name === 'CanceledError' ||
        name === 'AbortError' ||
        code === 'ERR_CANCELED' ||
        /canceled|aborted/i.test(msg),
    ).toBe(true)
  })
})

describe('clienteApiRepository.create — optional response envelope', () => {
  it('[P2] 201 without a Location header still returns the parsed DTO', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            id: 'no-loc',
            nombre: validPayload.nombre,
            nit: validPayload.nit,
            telefono: validPayload.telefono,
            ciudad: validPayload.ciudad,
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T12:00:00Z',
          },
          { status: 201 /* no Location header */ },
        ),
      ),
    )

    const created = await clienteApiRepository.create(validPayload)
    expect(created.id).toBe('no-loc')
    expect(created.nombre).toBe(validPayload.nombre)
  })

  it('[P2] 201 with unrelated extra fields does not throw (Cliente is a superset-tolerant shape)', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            id: 'extra',
            nombre: validPayload.nombre,
            nit: validPayload.nit,
            telefono: validPayload.telefono,
            ciudad: validPayload.ciudad,
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T12:00:00Z',
            // Extra field that future backend versions may add:
            createdBy: 'test-user',
          },
          { status: 201 },
        ),
      ),
    )

    const created = await clienteApiRepository.create(validPayload)
    expect(created.id).toBe('extra')
  })
})

describe('clienteApiRepository.create — unexpected error responses', () => {
  it.each([401, 403, 422, 429, 502, 503])(
    '[P2] status %i surfaces AxiosError with the same response status',
    async (status) => {
      server.use(
        http.post('*/api/v1/clientes', () =>
          HttpResponse.json({ status, title: `HTTP ${status}` }, { status }),
        ),
      )

      let caught: AxiosError | undefined
      try {
        await clienteApiRepository.create(validPayload)
      } catch (e) {
        caught = e as AxiosError
      }
      expect(caught).toBeDefined()
      expect(caught?.response?.status).toBe(status)
    },
  )

  it('[P2] non-2xx with an empty body still surfaces as AxiosError (not silently resolved)', async () => {
    server.use(
      http.post('*/api/v1/clientes', () => new HttpResponse(null, { status: 500 })),
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
})

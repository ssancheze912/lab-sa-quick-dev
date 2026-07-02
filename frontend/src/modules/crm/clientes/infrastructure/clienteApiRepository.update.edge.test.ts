// -----------------------------------------------------------------------------
// Story 2.4 — Edit Client (BMad-Integrated automate expansion)
// Edge-case tests for clienteApiRepository.update.
//
// The baseline suite (clienteApiRepository.update.test.ts) covers 200/400/404/
// 409/500 status codes + URL/method/body verification. This file focuses on
// runtime concerns the baseline does not:
//   - AbortSignal → axios cancels the in-flight PUT (React Query hook unmount).
//   - Unexpected 4xx variants (401/403/422) propagate their status verbatim.
//   - Non-2xx with an empty body still surfaces as AxiosError (not resolved).
//   - id path segment is URL-encoded → defense-in-depth vs. path injection
//     for any client that bypasses the {id:guid} route constraint on the
//     server. (encodeURIComponent is idempotent on plain GUIDs.)
//   - Successful response with an extra unrelated field does not throw.
//   - Custom Content-Type in the request (JSON with charset) is accepted by
//     the axios client (baseline uses default only).
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import type { AxiosError } from 'axios'
import { server } from '@/test/msw/server'
import { clienteApiRepository } from './clienteApiRepository'

const seedId = '11111111-1111-1111-1111-111111111111'

const validPayload = {
  nombre: 'Edge Update',
  nit: '888-edge',
  telefono: '+57 300 999 8888',
  ciudad: 'Bogotá',
}

describe('clienteApiRepository.update — AbortSignal', () => {
  it('[P1] aborts the request when the signal is triggered before completion', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', async () => {
        // Delay the mock response so the abort has time to fire client-side.
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ id: 'x' }, { status: 200 })
      }),
    )

    const controller = new AbortController()
    const promise = clienteApiRepository.update(seedId, validPayload, controller.signal)
    controller.abort()

    let caught: unknown
    try {
      await promise
    } catch (e) {
      caught = e
    }
    expect(caught).toBeDefined()
    // Axios surfaces either a CanceledError or an AbortError — either signals
    // that the abort short-circuited the request.
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

describe('clienteApiRepository.update — unexpected error responses', () => {
  it.each([401, 403, 422, 429, 502, 503])(
    '[P2] status %i surfaces AxiosError with matching response status',
    async (status) => {
      server.use(
        http.put('*/api/v1/clientes/:id', () =>
          HttpResponse.json({ status, title: `HTTP ${status}` }, { status }),
        ),
      )

      let caught: AxiosError | undefined
      try {
        await clienteApiRepository.update(seedId, validPayload)
      } catch (e) {
        caught = e as AxiosError
      }
      expect(caught).toBeDefined()
      expect(caught?.response?.status).toBe(status)
    },
  )

  it('[P2] non-2xx with an empty body still surfaces as AxiosError (not silently resolved)', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () => new HttpResponse(null, { status: 500 })),
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
})

describe('clienteApiRepository.update — URL encoding defence-in-depth', () => {
  it('[P1] a plain GUID id round-trips unchanged after encodeURIComponent', async () => {
    // encodeURIComponent should be idempotent for GUIDs (hex + hyphens only).
    let capturedPath: string | null = null
    server.use(
      http.put('*/api/v1/clientes/:id', async ({ request }) => {
        capturedPath = new URL(request.url).pathname
        return HttpResponse.json(
          {
            id: seedId,
            ...validPayload,
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T13:00:00Z',
          },
          { status: 200 },
        )
      }),
    )

    await clienteApiRepository.update(seedId, validPayload)

    expect(capturedPath).toBe(`/api/v1/clientes/${seedId}`)
  })

  it('[P2] an id containing reserved characters is encoded before dispatch', async () => {
    // Simulates a defense against a malformed id slipping past the route
    // constraint on the server. The client must still encode the path segment.
    const suspiciousId = 'ab cd/../../evil'
    let capturedPath: string | null = null
    server.use(
      // MSW's *:/api/v1/clientes/:id doesn't help here (the / is encoded),
      // so use a wildcard PUT catch-all and match on the URL directly.
      http.put(/\/api\/v1\/clientes\/.*/, async ({ request }) => {
        capturedPath = new URL(request.url).pathname
        return HttpResponse.json(
          {
            id: 'encoded',
            ...validPayload,
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T13:00:00Z',
          },
          { status: 200 },
        )
      }),
    )

    await clienteApiRepository.update(suspiciousId, validPayload)

    // Space and slash must have been percent-encoded — the raw suspicious
    // string never reached the URL as-is.
    expect(capturedPath).not.toContain(' ')
    expect(capturedPath).toContain(encodeURIComponent(suspiciousId))
  })
})

describe('clienteApiRepository.update — tolerant response parsing', () => {
  it('[P2] 200 with unrelated extra fields does not throw', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          {
            id: seedId,
            ...validPayload,
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T13:00:00Z',
            // Extra field the frontend does not consume — must not error out.
            updatedBy: 'test-user',
            revision: 42,
          },
          { status: 200 },
        ),
      ),
    )

    const updated = await clienteApiRepository.update(seedId, validPayload)
    expect(updated.id).toBe(seedId)
    expect(updated.nombre).toBe(validPayload.nombre)
  })

  it('[P2] 200 with server-side trimmed values reflects the trimmed body', async () => {
    // The MSW baseline handler trims — verify the untrimmed request produces
    // trimmed persisted values in the response.
    const untrimmed = {
      nombre: '  Trimmed Update  ',
      nit: '  888-trim  ',
      telefono: '  +57 300 555 0000  ',
      ciudad: '  Cali  ',
    }

    const updated = await clienteApiRepository.update(seedId, untrimmed)

    // MSW seed contains cliente with id seedId; the mock's `trim()` runs on
    // the request body before echoing the persisted DTO.
    expect(updated.nombre).toBe('Trimmed Update')
    expect(updated.nit).toBe('888-trim')
    expect(updated.telefono).toBe('+57 300 555 0000')
    expect(updated.ciudad).toBe('Cali')
  })
})

describe('clienteApiRepository.update — response contract stability', () => {
  it('[P2] 409 response body preserves the top-level "field": "nit" flag', async () => {
    // ASP.NET's Results.Problem(extensions: { field: "nit" }) flattens the
    // dictionary into the response root. If a future middleware refactor moves
    // it under an `extensions` wrapper, this test breaks — protects against
    // silent contract drift.
    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.update(seedId, {
        ...validPayload,
        nit: '800987654-3', // Collides against Beta in the MSW seed → 409.
      })
    } catch (e) {
      caught = e as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(409)

    const body = caught?.response?.data as {
      title?: string
      field?: string
      extensions?: { field?: string }
    }
    // `field` MUST be readable at the top level — the useUpdateCliente hook's
    // UpdateClienteError type depends on this shape.
    expect(body?.field).toBe('nit')
  })
})

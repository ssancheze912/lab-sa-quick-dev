// -----------------------------------------------------------------------------
// Story 2.2 — Client Detail View
// Unit tests for the Axios-backed IClienteRepository.getById method.
//
// The ATDD baseline exercises getById only indirectly via useCliente. This
// suite isolates the repository so failures point at Axios wiring / URL
// construction / error propagation rather than TanStack Query state.
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import type { AxiosError } from 'axios'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { clienteApiRepository } from './clienteApiRepository'

describe('clienteApiRepository.getById', () => {
  it('[P1] returns the parsed Cliente when the backend responds 200', async () => {
    // GIVEN: MSW returns the seed cliente for GET /api/v1/clientes/:id
    const target = seedClientes[0]

    // WHEN: The repository is asked for that id
    const result = await clienteApiRepository.getById(target.id)

    // THEN: The result matches the seed exactly (id, nombre, nit, telefono,
    // ciudad, createdAt, updatedAt — the full ClienteDto shape)
    expect(result).toEqual(target)
  })

  it('[P1] rejects with an AxiosError exposing response.status === 404 for unknown ids', async () => {
    // GIVEN: The backend returns 404 Problem Details for an unknown id
    // (the default handler already emits this — no override needed)

    // WHEN: The repository is asked for an id that doesn't exist
    // THEN: The promise rejects with an AxiosError; callers check
    // error.response?.status to distinguish 404 (not-found panel) vs 5xx.
    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.getById('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    } catch (err) {
      caught = err as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(404)
  })

  it('[P1] rejects with an AxiosError exposing response.status === 500 on server error', async () => {
    // GIVEN: The backend returns 500 Problem Details for any detail request
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    // WHEN: The repository is asked for any id
    // THEN: The promise rejects with an AxiosError whose response.status is 500
    let caught: AxiosError | undefined
    try {
      await clienteApiRepository.getById(seedClientes[0].id)
    } catch (err) {
      caught = err as AxiosError
    }
    expect(caught).toBeDefined()
    expect(caught?.response?.status).toBe(500)
    expect(caught?.response?.status).not.toBe(404)
  })

  it('[P2] aborts the detail request when the caller signals cancellation', async () => {
    // GIVEN: A slow backend so the abort has time to fire before the response
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return HttpResponse.json(seedClientes[0])
      }),
    )

    const controller = new AbortController()

    // WHEN: The signal is aborted immediately after the call
    const promise = clienteApiRepository.getById(seedClientes[0].id, controller.signal)
    controller.abort()

    // THEN: The promise rejects (Axios maps aborted signals to a canceled error).
    // React Query surfaces this as a query cancellation, not a failure state.
    await expect(promise).rejects.toBeDefined()
  })

  it('[P2] targets exactly /api/v1/clientes/{id} — no double slash, no trailing slash', async () => {
    // GIVEN: A handler that captures the received path
    let capturedPath: string | null = null
    server.use(
      http.get('*/api/v1/clientes/:id', ({ request }) => {
        capturedPath = new URL(request.url).pathname
        return HttpResponse.json(seedClientes[0])
      }),
    )

    // WHEN: The repository is asked for the seed id
    await clienteApiRepository.getById(seedClientes[0].id)

    // THEN: The URL path is exactly /api/v1/clientes/{id} — no `//`, no trailing `/`
    expect(capturedPath).not.toBeNull()
    expect(capturedPath).toMatch(/\/api\/v1\/clientes\/[0-9a-f-]+$/)
    expect(capturedPath).not.toMatch(/\/\//)
    expect(capturedPath).not.toMatch(/\/$/)
    // AND: the last segment equals the id we passed
    expect(capturedPath?.split('/').pop()).toBe(seedClientes[0].id)
  })
})

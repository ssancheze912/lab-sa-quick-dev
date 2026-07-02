// -----------------------------------------------------------------------------
// Story 2.1 — Client List & Search
// Unit tests for the Axios-backed IClienteRepository infrastructure adapter.
//
// These tests isolate the repository from the useClientes hook by driving it
// directly. MSW intercepts the outbound HTTP call so we exercise the real
// Axios client wiring (baseURL, headers, JSON parsing).
// -----------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { clienteApiRepository } from './clienteApiRepository'

describe('clienteApiRepository', () => {
  it('[P1] returns the parsed Cliente[] array when the backend responds 200', async () => {
    // GIVEN: MSW returns the seeded clientes for GET /api/v1/clientes
    // (default handler in test/msw/handlers.ts)

    // WHEN: The repository is asked for the full list
    const result = await clienteApiRepository.getAll()

    // THEN: The array matches the seed shape exactly
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(seedClientes)
  })

  it('[P1] returns an empty array when the backend responds with []', async () => {
    // GIVEN: The backend returns an empty list
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])))

    // WHEN: The repository is asked for the full list
    const result = await clienteApiRepository.getAll()

    // THEN: The result is an empty array, not null / undefined
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('[P1] rejects with an Axios error when the backend responds 500', async () => {
    // GIVEN: The backend returns 500 Problem Details
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    // WHEN / THEN: The promise rejects (useClientes surfaces this as isError)
    await expect(clienteApiRepository.getAll()).rejects.toThrow()
  })

  it('[P2] aborts the request when the caller signals cancellation', async () => {
    // GIVEN: An AbortController that is aborted BEFORE the request finishes.
    // MSW would resolve after a delay if not aborted.
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return HttpResponse.json(seedClientes)
      }),
    )

    const controller = new AbortController()

    // WHEN: The signal is aborted immediately, before the response resolves
    const promise = clienteApiRepository.getAll(controller.signal)
    controller.abort()

    // THEN: The promise rejects (Axios surfaces canceled requests as an error)
    await expect(promise).rejects.toBeDefined()
  })

  it('[P2] returns each item with the full ClienteDto shape (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)', async () => {
    // GIVEN: Default handler with three seeded clientes
    // WHEN: The repository fetches the list
    const result = await clienteApiRepository.getAll()

    // THEN: Every item exposes the seven public read-model fields
    expect(result.length).toBeGreaterThan(0)
    for (const c of result) {
      expect(c).toEqual(
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
    }
  })
})

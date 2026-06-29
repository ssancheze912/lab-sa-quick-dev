/**
 * Story 2.3 — clienteApiRepository.create ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #6 — 201 returns the parsed Cliente object.
 *   AC #7 — 409 throws `DuplicateNitError` (typed at the infra layer; no body propagated).
 *   AC #8 — 400 throws `ClienteValidationError` whose `fieldErrors` equals the body's `errors` map.
 *   AC #8 — 500 re-throws the underlying transport error (NOT wrapped).
 *   AC #8 — Network error (no `response`) re-throws the underlying transport error.
 *
 * MUST fail until clienteApiRepository.create + the two typed errors
 * (DuplicateNitError, ClienteValidationError) are implemented (Tasks 7, 8, 9).
 */
import { describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'

import { server } from '@/mocks/server'
import { buildClienteFixture } from '@/mocks/handlers/clientes'
import { clienteApiRepository } from './clienteApiRepository'
import { DuplicateNitError, ClienteValidationError } from '../domain/errors'

describe('clienteApiRepository.create — Story 2.3 ATDD', () => {
  // ─── AC #6 — 201 returns the parsed Cliente ──────────────────────────────
  test('AC #6 — 201 returns the parsed Cliente', async () => {
    const newFixture = buildClienteFixture({ nombre: 'Repo Created' })
    server.use(
      http.post('*/api/v1/clientes', () => HttpResponse.json(newFixture, { status: 201 })),
    )

    const result = await clienteApiRepository.create({
      nombre: 'Repo Created',
      nitRuc: '900333444',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    expect(result).toEqual(newFixture)
  })

  // ─── AC #7 — 409 throws DuplicateNitError ────────────────────────────────
  test('AC #7 — 409 throws DuplicateNitError', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'NIT/RUC duplicado',
            status: 409,
            instance: '/api/v1/clientes',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    await expect(
      clienteApiRepository.create({
        nombre: 'Dup',
        nitRuc: '900111260',
        telefono: '3001234567',
        ciudad: 'Cali',
      }),
    ).rejects.toBeInstanceOf(DuplicateNitError)
  })

  // ─── AC #8 — 400 throws ClienteValidationError with field errors ─────────
  test('AC #8 — 400 throws ClienteValidationError whose fieldErrors equals body.errors', async () => {
    const errors = {
      nombre: ['El nombre es obligatorio'],
      nitRuc: ['El NIT/RUC es obligatorio'],
    }
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
            title: 'Datos inválidos',
            status: 400,
            instance: '/api/v1/clientes',
            errors,
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    try {
      await clienteApiRepository.create({
        nombre: '',
        nitRuc: '',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
      // Should not reach here
      expect.fail('create() should have thrown ClienteValidationError')
    } catch (err) {
      expect(err).toBeInstanceOf(ClienteValidationError)
      const validationErr = err as ClienteValidationError
      expect(validationErr.fieldErrors).toEqual(errors)
    }
  })

  // ─── AC #8 — 500 re-throws the raw transport error (NOT wrapped) ─────────
  test('AC #8 — 500 re-throws the AxiosError (not wrapped as a typed error)', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Server Error', status: 500 },
          { status: 500 },
        ),
      ),
    )

    try {
      await clienteApiRepository.create({
        nombre: 'Server Fail',
        nitRuc: '900111262',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
      expect.fail('create() should have thrown on 500')
    } catch (err) {
      // Should NOT be one of the typed errors
      expect(err).not.toBeInstanceOf(DuplicateNitError)
      expect(err).not.toBeInstanceOf(ClienteValidationError)
    }
  })

  // ─── AC #8 — Network error re-throws underlying transport error ──────────
  test('AC #8 — network error (no response) re-throws underlying transport error', async () => {
    server.use(
      http.post('*/api/v1/clientes', () => HttpResponse.error()),
    )

    try {
      await clienteApiRepository.create({
        nombre: 'Net Fail',
        nitRuc: '900111263',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
      expect.fail('create() should have thrown on network error')
    } catch (err) {
      expect(err).not.toBeInstanceOf(DuplicateNitError)
      expect(err).not.toBeInstanceOf(ClienteValidationError)
    }
  })
})

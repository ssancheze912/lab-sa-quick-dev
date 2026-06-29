/**
 * Story 2.3 — useCreateCliente mutation hook ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #6 — 201 happy path: mutation settles to success, ['clientes'] cache is
 *           updated (new client prepended at index 0) WITHOUT a refetch.
 *   AC #7 — 409 conflict: mutation settles to error whose
 *           `error instanceof DuplicateNitError === true`; cache is unchanged.
 *   AC #8 — 500 server error: mutation settles to error; NO retry attempts
 *           (POST is non-idempotent); cache is unchanged.
 *   AC #8 — 400 validation error: mutation settles to error whose
 *           `error instanceof ClienteValidationError === true`; cache is unchanged.
 *
 * MUST fail until application/useCreateCliente.ts +
 * domain/errors.ts (with DuplicateNitError / ClienteValidationError) +
 * infrastructure/clienteApiRepository.ts#create are implemented (Tasks 7, 8, 9, 10).
 */
import { describe, expect, test } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'

import { server } from '@/mocks/server'
import { buildClienteFixture } from '@/mocks/handlers/clientes'
import { useCreateCliente } from './useCreateCliente'
import { DuplicateNitError, ClienteValidationError } from '../domain/errors'

function makeWrapper(initialClientes?: ReturnType<typeof buildClienteFixture>[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  if (initialClientes) {
    queryClient.setQueryData(['clientes'], initialClientes)
  }
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

describe('useCreateCliente — Story 2.3 ATDD', () => {
  // ─── AC #6 — Success path: 201 + cache prepend (no refetch) ───────────────
  test('AC #6 — settles to success with the new dto and prepends to ["clientes"] cache', async () => {
    // GIVEN: backend returns 201 with the new fixture, and the cache has an existing client
    const newFixture = buildClienteFixture({ nombre: 'Hook Created' })
    server.use(
      http.post('*/api/v1/clientes', () => HttpResponse.json(newFixture, { status: 201 })),
    )

    const existing = buildClienteFixture({ nombre: 'Existing' })
    const { Wrapper, queryClient } = makeWrapper([existing])

    // WHEN: the mutation is invoked with a valid payload
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    result.current.mutate({
      nombre: 'Hook Created',
      nitRuc: '900222333',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    // THEN: it reaches success with the dto
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.data).toMatchObject({ id: newFixture.id, nombre: 'Hook Created' })

    // AND: the cache for ['clientes'] now has the new client at index 0 (prepend)
    const cached = queryClient.getQueryData<ReturnType<typeof buildClienteFixture>[]>(['clientes'])
    expect(cached).toBeDefined()
    expect(cached?.[0]?.id).toBe(newFixture.id)
    expect(cached?.[1]?.id).toBe(existing.id)
  })

  // ─── AC #6 — When cache is undefined, success seeds a single-item array ───
  test('AC #6 — when the cache is undefined, success seeds ["clientes"] with [new]', async () => {
    const newFixture = buildClienteFixture({ nombre: 'Solo' })
    server.use(
      http.post('*/api/v1/clientes', () => HttpResponse.json(newFixture, { status: 201 })),
    )

    const { Wrapper, queryClient } = makeWrapper() // no initial cache

    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    result.current.mutate({
      nombre: 'Solo',
      nitRuc: '900222334',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    const cached = queryClient.getQueryData<ReturnType<typeof buildClienteFixture>[]>(['clientes'])
    expect(cached).toEqual([newFixture])
  })

  // ─── AC #7 — 409 → DuplicateNitError; cache unchanged ─────────────────────
  test('AC #7 — settles to error whose error instanceof DuplicateNitError on 409; cache unchanged', async () => {
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

    const existing = buildClienteFixture({ nombre: 'Untouched' })
    const { Wrapper, queryClient } = makeWrapper([existing])

    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    result.current.mutate({
      nombre: 'Dup',
      nitRuc: '900111260',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBeInstanceOf(DuplicateNitError)

    // AND: cache is unchanged
    const cached = queryClient.getQueryData<ReturnType<typeof buildClienteFixture>[]>(['clientes'])
    expect(cached).toEqual([existing])
  })

  // ─── AC #8 — 400 → ClienteValidationError; cache unchanged ────────────────
  test('AC #8 — settles to error whose error instanceof ClienteValidationError on 400; cache unchanged', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
            title: 'Datos inválidos',
            status: 400,
            instance: '/api/v1/clientes',
            errors: { nombre: ['Nombre inválido'] },
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const existing = buildClienteFixture({ nombre: 'Untouched' })
    const { Wrapper, queryClient } = makeWrapper([existing])

    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    result.current.mutate({
      nombre: '',
      nitRuc: '900111261',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBeInstanceOf(ClienteValidationError)

    // AND: cache unchanged
    const cached = queryClient.getQueryData<ReturnType<typeof buildClienteFixture>[]>(['clientes'])
    expect(cached).toEqual([existing])
  })

  // ─── AC #8 — 500 → generic error, no retry, cache unchanged ───────────────
  test('AC #8 — settles to error on 500; handler is hit exactly ONCE (no retry); cache unchanged', async () => {
    let calls = 0
    server.use(
      http.post('*/api/v1/clientes', () => {
        calls += 1
        return HttpResponse.json(
          { type: 'about:blank', title: 'Server Error', status: 500 },
          { status: 500 },
        )
      }),
    )

    const existing = buildClienteFixture({ nombre: 'Untouched' })
    const { Wrapper, queryClient } = makeWrapper([existing])

    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper })
    result.current.mutate({
      nombre: 'Fail',
      nitRuc: '900111262',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    // POST is non-idempotent → NO retries
    expect(calls).toBe(1)
    expect(result.current.error).not.toBeInstanceOf(DuplicateNitError)
    expect(result.current.error).not.toBeInstanceOf(ClienteValidationError)

    // AND: cache unchanged
    const cached = queryClient.getQueryData<ReturnType<typeof buildClienteFixture>[]>(['clientes'])
    expect(cached).toEqual([existing])
  })
})

/**
 * MSW handlers factory for the Clientes module.
 * Referenced by `ClienteListView.test.tsx` (Story 2.1) and future component
 * tests in Stories 2.2–2.6.
 *
 * The wildcard host (`*/api/v1/clientes`) matches regardless of the Axios
 * `baseURL` (which is read from `import.meta.env.VITE_API_URL`), so tests do
 * not need to know or override the environment variable.
 */

import { http, HttpResponse } from 'msw'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

export const clientesHandlers = {
  /**
   * Returns the provided list on `GET /api/v1/clientes`.
   * Use this for happy-path scenarios (list + search + selection).
   */
  list: (data: Cliente[]) =>
    http.get('*/api/v1/clientes', () => HttpResponse.json(data)),

  /**
   * Returns an empty array on `GET /api/v1/clientes`.
   * Exercises the EmptyState render path (TC-E2-P1-02).
   */
  empty: () =>
    http.get('*/api/v1/clientes', () => HttpResponse.json([])),

  /**
   * Returns a JSON error response on `GET /api/v1/clientes`.
   * Exercises the ErrorPanel render path + Reintentar (TC-E2-P1-03).
   */
  error: (status = 500) =>
    http.get(
      '*/api/v1/clientes',
      () => new HttpResponse(null, { status }),
    ),

  /**
   * Delayed happy-path — used to exercise the loading skeleton state before
   * the query resolves. Delay is applied via `await new Promise(setTimeout)`.
   */
  listDelayed: (data: Cliente[], delayMs: number) =>
    http.get('*/api/v1/clientes', async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return HttpResponse.json(data)
    }),
}

/**
 * Deterministic Cliente factory for tests. All defaults are valid domain
 * values (Spanish city, Colombia-style NIT, ISO-8601 with offset timestamps).
 * Overrides win.
 */
let counter = 0

export function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  counter += 1
  const nowIso = new Date().toISOString().replace('Z', '+00:00')
  return {
    id: `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`,
    nombre: `Cliente Demo ${counter}`,
    nitRuc: `900${counter.toString().padStart(6, '0')}-1`,
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  }
}

/**
 * Reset the deterministic counter — call from `beforeEach` in test files that
 * assume a fresh IDs sequence.
 */
export function resetClienteFactoryCounter(): void {
  counter = 0
}

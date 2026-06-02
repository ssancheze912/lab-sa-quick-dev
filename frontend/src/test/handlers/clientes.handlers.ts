/**
 * MSW request handlers for the `GET /api/v1/clientes` endpoint (Story 2.1).
 *
 * Used by the failing ATDD tests for:
 *   - TC-E2-P1-03 (EmptyState when zero clients)
 *   - TC-E2-P1-04 (ErrorPanel + Reintentar on fetch failure)
 *
 * VITE_API_URL is read from .env.test (`http://localhost:5000` by default
 * — see Story 2.1 Task 9). MSW intercepts the absolute URL Axios builds.
 *
 * NOTE: The setup file (`src/test/setup.ts`) starts the shared MSW server
 *       per Vitest run. Tests register per-test overrides via `server.use(...)`.
 */

import { http, HttpResponse, type HttpHandler } from 'msw'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const ENDPOINT = `${BASE}/api/v1/clientes`

/** Returns 200 + [] (empty list — triggers EmptyState). */
export const clientesSuccessEmpty: HttpHandler = http.get(ENDPOINT, () => {
  return HttpResponse.json([])
})

/** Returns 200 + the canonical 3-fixture dataset (default happy path). */
export const clientesSuccessThree = (data: Cliente[]): HttpHandler =>
  http.get(ENDPOINT, () => {
    return HttpResponse.json(data)
  })

/**
 * Returns 500 + a Problem Details body (NFR6).
 * The frontend MUST NOT render the `detail` field; the ATDD test asserts
 * the body string is absent from the DOM.
 */
export const clientesError500: HttpHandler = http.get(ENDPOINT, () => {
  return HttpResponse.json(
    {
      type: 'https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'INTERNAL_DB_LEAK_SENSITIVE_STACK_TRACE: System.Data.SqlException at Foo.Bar',
      instance: '/api/v1/clientes',
    },
    { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
  )
})

/**
 * Two-phase handler: first call returns 500, subsequent calls return success.
 * Drives the Reintentar flow assertion in TC-E2-P1-04.
 */
export function clientesErrorThenSuccess(successData: Cliente[]): HttpHandler {
  let callCount = 0
  return http.get(ENDPOINT, () => {
    callCount += 1
    if (callCount === 1) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          detail: 'INTERNAL_DB_LEAK_SENSITIVE_STACK_TRACE',
          instance: '/api/v1/clientes',
        },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      )
    }
    return HttpResponse.json(successData)
  })
}

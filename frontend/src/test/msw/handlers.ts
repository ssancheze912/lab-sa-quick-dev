/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Default MSW handlers used by Vitest tests. Individual tests are free to
 * override with `server.use(http.get(...))` per case.
 *
 * The default handler for `GET /api/v1/clientes` returns an empty list — tests
 * that assert list contents override this with a fixture-specific payload.
 */
import { http, HttpResponse } from 'msw'

export const API_BASE = 'http://localhost:5000'

export const defaultHandlers = [
  http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
]

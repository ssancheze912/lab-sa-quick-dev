/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Central MSW server for Vitest tests. Started once per test process by
 * `test-setup.ts` (`beforeAll`/`afterEach`/`afterAll`).
 *
 * Tests are expected to override handlers per case:
 *
 *   server.use(
 *     http.get('http://localhost:5000/api/v1/clientes', () =>
 *       HttpResponse.json([...], { status: 200 })
 *     ),
 *   )
 */
import { setupServer } from 'msw/node'
import { defaultHandlers } from './handlers'

export const server = setupServer(...defaultHandlers)

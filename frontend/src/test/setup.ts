/**
 * Vitest global test setup.
 *
 * Story 2.1 (TEA RED phase) adds an MSW `setupServer` that intercepts the
 * Axios `apiClient` requests fired by `useClientes()`. Per-test handlers
 * are registered with `server.use(...)`; `afterEach` resets to defaults.
 *
 * NOTE: `setupServer` lives in `msw/node` — it is ONLY pulled by Vitest
 *       (configured in `vitest.config.ts` setupFiles). It is NOT bundled
 *       into the production app (Vite tree-shakes test-only imports).
 *
 * `onUnhandledRequest: 'bypass'` is used (NOT `'error'`) so existing
 * Story 1.x tests that incidentally don't hit the network still pass.
 * Story 2.1 component tests register their handlers via `server.use(...)`.
 */

import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'

export const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

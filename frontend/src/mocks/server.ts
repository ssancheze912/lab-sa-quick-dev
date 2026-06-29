import { setupServer } from 'msw/node'

/**
 * Test-only MSW server. Wired into Vitest via src/test-setup.ts.
 * Tests register their own per-suite handlers via server.use(...).
 */
export const server = setupServer()

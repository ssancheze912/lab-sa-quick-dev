import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW server for Vitest. Individual tests can override handlers via
 * `server.use(...)` inside a `beforeEach` block, and `server.resetHandlers()`
 * (wired in `test/setup.ts`) restores the default set between tests.
 */
export const server = setupServer(...handlers)

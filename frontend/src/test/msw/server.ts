import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Shared MSW server instance for component tests (Node/jsdom environment).
 * Started/reset/stopped from `src/test/setup.ts` so every test file gets a
 * clean handler stack (no leaked `server.use()` overrides between tests).
 */
export const server = setupServer(...handlers)

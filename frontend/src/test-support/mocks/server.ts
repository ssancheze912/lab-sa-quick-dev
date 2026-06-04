/**
 * MSW 2.x test server setup for Vitest (Node/jsdom environment).
 * Import and use in component tests that need network mocking.
 *
 * Usage in a test file:
 *   import { server } from '../../test-support/mocks/server'
 *   // server is already set up via beforeAll/afterEach/afterAll below
 */

import { setupServer } from 'msw/node';

export const server = setupServer();

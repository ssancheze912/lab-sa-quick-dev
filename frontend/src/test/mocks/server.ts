/**
 * MSW Node server for Vitest (jsdom environment) — shared test infrastructure
 *
 * Usage in test files:
 *   import { server } from '../../test/mocks/server'
 *   beforeAll(() => server.listen())
 *   afterEach(() => server.resetHandlers())
 *   afterAll(() => server.close())
 */

import { setupServer } from 'msw/node';
import { clientesHandlers } from './handlers/clientes.handlers';

export const server = setupServer(...clientesHandlers);

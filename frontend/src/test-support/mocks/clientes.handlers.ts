/**
 * MSW 2.x request handlers for /api/v1/clientes endpoint.
 * Used by ClienteListView component tests.
 *
 * Import into your test file:
 *   import { clientesHandlers } from '../test-support/mocks/clientes.handlers'
 *   server.use(...clientesHandlers.success(mockData))
 */

import { http, HttpResponse } from 'msw';
import type { ClienteTestData } from '../factories/cliente.factory';

const CLIENTES_URL = '*/api/v1/clientes';

export const clientesHandlers = {
  /** Handler that returns a list of clients with HTTP 200 */
  success: (clientes: ClienteTestData[]) =>
    http.get(CLIENTES_URL, () => HttpResponse.json(clientes)),

  /** Handler that returns an empty array with HTTP 200 */
  empty: () =>
    http.get(CLIENTES_URL, () => HttpResponse.json([])),

  /** Handler that returns a 500 Internal Server Error (Problem Details RFC 7807) */
  serverError: () =>
    http.get(CLIENTES_URL, () =>
      HttpResponse.json(
        { title: 'Internal Server Error', status: 500, detail: 'An unexpected error occurred.' },
        { status: 500 }
      )
    ),

  /** Handler that simulates a network error (connection refused) */
  networkError: () =>
    http.get(CLIENTES_URL, () => HttpResponse.error()),
};

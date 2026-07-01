import { http, HttpResponse } from 'msw'
import { createClientes } from '@/test/factories/cliente.factory'

/**
 * Default MSW request handlers for `/api/v1/clientes` (Story 2.1).
 *
 * Per network-first.md, these handlers must be registered BEFORE the
 * component under test triggers its fetch (i.e. before `render`/navigation),
 * never patched in afterwards. Individual tests override the `GET /clientes`
 * handler via `server.use(...)` for empty-list / search-empty / error /
 * retry-success scenarios (see network-first.md Example 3: Network Stub with
 * Edge Cases).
 *
 * Base URL matches `frontend/.env.development` (`VITE_API_URL`); the `*`
 * wildcard host segment additionally matches whatever base URL Vitest/jsdom
 * resolves axios' relative baseURL against, keeping handlers stable across
 * environments.
 */
export const CLIENTES_ENDPOINT = '*/api/v1/clientes'

export const defaultClientesList = createClientes(5)

export const handlers = [
  http.get(CLIENTES_ENDPOINT, () => {
    return HttpResponse.json(defaultClientesList, { status: 200 })
  }),
]

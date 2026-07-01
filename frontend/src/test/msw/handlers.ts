import { http, HttpResponse } from 'msw'
import { createCliente, createClientes } from '@/test/factories/cliente.factory'

/**
 * Default MSW request handlers for `/api/v1/clientes` (Story 2.1) and
 * `/api/v1/clientes/:id` (Story 2.2 — Client Detail View).
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
export const CLIENTE_BY_ID_ENDPOINT = '*/api/v1/clientes/:id'

export const defaultClientesList = createClientes(5)
export const defaultCliente = createCliente()

/**
 * RFC 7807 Problem Details body for the 404 case (Story 2.2, AC #3), matching
 * the backend's `GET /api/v1/clientes/{id}` contract — no stack trace / no
 * technical leakage per NFR6.
 */
export const clienteNotFoundProblemDetails = {
  type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
  title: 'Not Found',
  status: 404,
  detail: 'Cliente no encontrado.',
}

export const handlers = [
  http.get(CLIENTES_ENDPOINT, () => {
    return HttpResponse.json(defaultClientesList, { status: 200 })
  }),
  http.get(CLIENTE_BY_ID_ENDPOINT, ({ params }) => {
    return HttpResponse.json({ ...defaultCliente, id: params.id as string }, { status: 200 })
  }),
]

/**
 * Story 2.2 — Typed error class for the controlled 404 branch of the
 * `GET /api/v1/clientes/{id}` endpoint. The UI inspects
 * `error instanceof ClienteNotFoundError` to render `<ClienteNotFound />` instead
 * of `<ErrorPanel />`. NFR6: the message is a fixed English internal string
 * and is NEVER displayed to the user; only the `clienteId` is carried, and the
 * caller already knew that id (it came from the URL).
 */
export class ClienteNotFoundError extends Error {
  readonly clienteId: string

  constructor(clienteId: string) {
    super('Cliente not found')
    this.name = 'ClienteNotFoundError'
    this.clienteId = clienteId
  }
}

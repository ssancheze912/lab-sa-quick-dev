import type { Cliente } from './Cliente'

/**
 * Payload for creating a new cliente. Story 2.3 — all four fields are required
 * at the form layer (Zod). The repository transports the values as-is to the
 * backend; trimming is performed server-side by the entity factory.
 */
export interface CreateClienteInput {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

/**
 * Payload for updating a cliente. Story 2.4 — same shape as
 * {@link CreateClienteInput} but intentionally a separate type so future stories
 * can diverge without breaking the create contract.
 */
export interface UpdateClienteInput {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

/**
 * Result of a `DELETE /api/v1/clientes/{id}` call. Returned by the
 * infrastructure layer so the application hook can branch on the
 * `X-Contactos-Orphaned` header without inspecting raw Axios responses
 * from the consumer side. Story 2.5.
 */
export interface DeleteClienteResult {
  contactosOrphaned: number
}

/**
 * Repository contract for clientes. Story 2.1 wires `getAll`; Story 2.2 adds
 * `getById` (returns `null` on 404). Story 2.3 adds `create`. Story 2.4 adds
 * `update`. Story 2.5 adds `delete`.
 */
export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente | null>
  create(input: CreateClienteInput): Promise<Cliente>
  update(id: string, input: UpdateClienteInput): Promise<Cliente>
  delete(id: string): Promise<DeleteClienteResult>
}

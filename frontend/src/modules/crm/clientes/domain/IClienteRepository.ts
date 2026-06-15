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
 * Repository contract for clientes. Story 2.1 wires `getAll`; Story 2.2 adds
 * `getById` (returns `null` on 404). Story 2.3 adds `create`.
 */
export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente | null>
  create(input: CreateClienteInput): Promise<Cliente>
}

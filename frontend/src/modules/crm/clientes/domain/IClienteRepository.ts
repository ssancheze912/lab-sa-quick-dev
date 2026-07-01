import type { Cliente } from './Cliente'

/**
 * Repository contract for the Cliente aggregate — Story 2.1.
 *
 * Only the read operation `getAll` is defined in this story. Later stories
 * extend the surface (`getById`, `create`, `update`, `delete`).
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
}

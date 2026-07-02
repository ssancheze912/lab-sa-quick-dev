import type { Cliente } from './Cliente'

/**
 * Read-only repository contract for Story 2.1.
 * Write operations (create/update/delete) land in Stories 2.3–2.5.
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
}

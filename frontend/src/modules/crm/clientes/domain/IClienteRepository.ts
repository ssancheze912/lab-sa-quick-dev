import type { Cliente } from './Cliente'

/**
 * Read-side repository contract. Write methods will be added in
 * Stories 2.3 / 2.4 / 2.5.
 */
export interface IClienteRepository {
  getAll(search?: string): Promise<Cliente[]>
  /**
   * Fetches a single client by id. Throws `ClienteNotFoundError` (from
   * `./errors`) when the backend responds with 404. Other failures bubble up
   * as the underlying transport error so TanStack Query can decide to retry.
   */
  getById(id: string): Promise<Cliente>
}

import type { Cliente } from './Cliente'

/**
 * Read-side repository contract. Write methods will be added in
 * Stories 2.3 / 2.4 / 2.5.
 */
export interface IClienteRepository {
  getAll(search?: string): Promise<Cliente[]>
}

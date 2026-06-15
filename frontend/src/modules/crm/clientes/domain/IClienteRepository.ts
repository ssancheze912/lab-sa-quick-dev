import type { Cliente } from './Cliente'

/**
 * Repository contract for clientes. Story 2.1 only wires `getAll`; further
 * stories (2.2 / 2.3 / 2.4 / 2.5) will append additional signatures.
 */
export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
}

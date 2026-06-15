import type { Cliente } from './Cliente'

/**
 * Repository contract for clientes. Story 2.1 wires `getAll`; Story 2.2 adds
 * `getById` (returns `null` on 404 so the UI can branch between "not found"
 * and "transport error").
 */
export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente | null>
}

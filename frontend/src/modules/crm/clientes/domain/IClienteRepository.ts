import type { Cliente } from './Cliente'
import type { ClienteFormValues } from '../application/clienteSchema'

/**
 * Repository contract for Cliente.
 * Story 2.1 introduced `getAll` + `getById`. Story 2.3 adds `create`.
 * Story 2.4 adds `update`.
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
  getById(id: string, signal?: AbortSignal): Promise<Cliente>
  create(payload: ClienteFormValues, signal?: AbortSignal): Promise<Cliente>
  update(id: string, payload: ClienteFormValues, signal?: AbortSignal): Promise<Cliente>
}

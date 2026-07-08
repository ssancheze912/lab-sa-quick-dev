import type { Cliente } from './Cliente'

/**
 * Repository contract for Cliente (Story 2.1).
 * `getById` is declared upfront so Story 2.2 can consume it without churning
 * the interface — Story 2.1 only uses `getAll`.
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
  getById(id: string, signal?: AbortSignal): Promise<Cliente>
}

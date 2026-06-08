import type { Cliente } from './Cliente'

/**
 * Story 2.1 exposes only the read-side `getAll`. Subsequent stories
 * (2.2 / 2.3 / 2.4 / 2.5) add `getById` + the mutations.
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
}

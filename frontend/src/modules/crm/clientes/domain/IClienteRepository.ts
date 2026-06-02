import type { Cliente } from './Cliente'

/**
 * Repository contract for fetching {@link Cliente} aggregates from the API.
 * Implementations live in `infrastructure/`. Consumers should depend on this
 * abstraction (Clean Architecture / DDD — see company standards).
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
}

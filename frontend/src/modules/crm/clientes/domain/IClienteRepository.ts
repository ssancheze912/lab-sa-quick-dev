import type { Cliente } from './Cliente'

/**
 * Repository contract for the `Cliente` aggregate on the frontend.
 * Story 2.1 requires only `getAll`; subsequent stories extend the surface.
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
}

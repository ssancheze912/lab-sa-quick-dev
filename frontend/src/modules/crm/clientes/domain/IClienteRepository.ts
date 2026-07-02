import type { Cliente } from './Cliente'

/**
 * Read-only repository contract for Stories 2.1 & 2.2.
 * Write operations (create/update/delete) land in Stories 2.3–2.5.
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
  /**
   * Fetches a single cliente by id. Rejects with the AxiosError when the
   * backend responds with a non-2xx status (React Query surfaces it as
   * `isError`; callers inspect `error.response?.status`).
   */
  getById(id: string, signal?: AbortSignal): Promise<Cliente>
}

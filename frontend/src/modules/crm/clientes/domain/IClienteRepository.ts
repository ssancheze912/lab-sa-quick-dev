import type { Cliente } from './Cliente'

/**
 * Payload accepted by POST /api/v1/clientes. Same shape as ClienteFormValues,
 * kept as its own type so the repository contract does not leak Zod details.
 */
export type CreateClientePayload = {
  readonly nombre: string
  readonly nit: string
  readonly telefono: string
  readonly ciudad: string
}

/**
 * Repository contract for the clientes CRM feature.
 * Read operations landed in Stories 2.1 & 2.2; write operations start with
 * `create` in Story 2.3 (update/delete land in 2.4/2.5).
 */
export interface IClienteRepository {
  getAll(signal?: AbortSignal): Promise<Cliente[]>
  /**
   * Fetches a single cliente by id. Rejects with the AxiosError when the
   * backend responds with a non-2xx status (React Query surfaces it as
   * `isError`; callers inspect `error.response?.status`).
   */
  getById(id: string, signal?: AbortSignal): Promise<Cliente>
  /**
   * POST /api/v1/clientes → 201 Created returning the freshly persisted
   * Cliente. Rejects with an AxiosError when the server responds 4xx/5xx
   * (React Query surfaces the error; callers inspect `error.response?.status`
   * — 409 signals a duplicate NIT).
   */
  create(payload: CreateClientePayload, signal?: AbortSignal): Promise<Cliente>
}

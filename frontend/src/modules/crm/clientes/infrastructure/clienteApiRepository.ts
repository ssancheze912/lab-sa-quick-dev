import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of {@link IClienteRepository}.
 *
 * Calls `GET /api/v1/clientes` and returns the response body directly (the
 * backend responds with an unwrapped JSON array per Story 2.1 AC #7).
 * Forwards the AbortSignal so TanStack Query can cancel in-flight requests
 * when a component unmounts.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(signal) {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
    return data
  },
}

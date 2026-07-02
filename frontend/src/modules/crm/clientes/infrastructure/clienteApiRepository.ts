import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of IClienteRepository.
 * Uses AbortSignal so React Query can cancel in-flight requests on unmount.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(signal) {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
    return data
  },
  async getById(id, signal) {
    // Non-2xx responses raise AxiosError intentionally — React Query maps that
    // to `isError` and callers inspect `error.response?.status` (404 vs 5xx).
    // encodeURIComponent guards against path injection when id contains any
    // reserved char (backend also has route constraint `{id:guid}`, but
    // encoding is a client-side defence-in-depth per OWASP).
    const { data } = await apiClient.get<Cliente>(
      `/api/v1/clientes/${encodeURIComponent(id)}`,
      { signal },
    )
    return data
  },
}

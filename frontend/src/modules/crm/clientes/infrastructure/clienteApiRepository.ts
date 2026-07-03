import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of `IClienteRepository`. Reuses the shared
 * `apiClient` (base URL comes from `VITE_API_URL`); the AbortSignal from
 * TanStack Query enables automatic request cancellation on unmount.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(signal) {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
    return data
  },
  async getById(id, signal) {
    const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`, { signal })
    return data
  },
}

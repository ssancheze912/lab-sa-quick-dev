import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of `IClienteRepository` (Story 2.1).
 * Base URL is inherited from `apiClient` (env `VITE_API_URL`) — no wrapping.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(signal) {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
    return data
  },
  async getById(id, signal) {
    const { data } = await apiClient.get<Cliente>(
      `/api/v1/clientes/${encodeURIComponent(id)}`,
      { signal },
    )
    return data
  },
}

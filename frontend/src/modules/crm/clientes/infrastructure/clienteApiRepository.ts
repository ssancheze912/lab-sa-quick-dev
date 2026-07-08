import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'
import type { ClienteFormValues } from '../application/clienteSchema'

/**
 * Axios-backed implementation of `IClienteRepository` (Story 2.1).
 * Story 2.3 adds `create`. Base URL is inherited from `apiClient`
 * (env `VITE_API_URL`) — no wrapping.
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
  async create(payload: ClienteFormValues, signal) {
    const { data } = await apiClient.post<Cliente>('/api/v1/clientes', payload, { signal })
    return data
  },
  async update(id: string, payload: ClienteFormValues, signal) {
    const { data } = await apiClient.put<Cliente>(
      `/api/v1/clientes/${encodeURIComponent(id)}`,
      payload,
      { signal },
    )
    return data
  },
}

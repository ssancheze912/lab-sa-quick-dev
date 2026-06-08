import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of `IClienteRepository`. The backend returns a
 * direct JSON array (no wrapper object) per AC #2.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(signal) {
    const res = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
    return res.data
  },
}

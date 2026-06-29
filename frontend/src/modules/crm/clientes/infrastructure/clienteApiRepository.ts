import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of {@link IClienteRepository}. Story 2.1 only
 * uses the parameterless GET; the optional `search` argument is exposed so
 * the contract is forward-compatible with future server-side filtering.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(search?: string): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes', {
      params: search ? { search } : undefined,
    })
    return response.data
  },
}

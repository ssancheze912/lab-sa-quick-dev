import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * Axios-backed implementation of {@link IClienteRepository}.
 * Story 2.1 only needs the list endpoint; create / update / delete arrive in
 * Stories 2.3 / 2.4 / 2.5 and will be appended to this same singleton.
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(signal?: AbortSignal): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
    return response.data
  },
}

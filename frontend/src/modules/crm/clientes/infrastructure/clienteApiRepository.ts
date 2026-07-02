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
}

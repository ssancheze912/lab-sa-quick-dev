import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * HTTP-backed implementation of {@link IClienteRepository} using the shared
 * Axios singleton (`apiClient`).
 */
export const clienteApiRepository: IClienteRepository = {
  getAll: () =>
    apiClient.get<Cliente[]>('/api/v1/clientes').then((r) => r.data),
}

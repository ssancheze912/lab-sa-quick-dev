import { apiClient } from '@/shared/lib/apiClient'
import type { IClienteRepository } from '../domain/IClienteRepository'
import type { Cliente } from '../domain/Cliente'

export const clienteApiRepository: IClienteRepository = {
  getAll: () => apiClient.get<Cliente[]>('/api/v1/clientes').then((r) => r.data),
}

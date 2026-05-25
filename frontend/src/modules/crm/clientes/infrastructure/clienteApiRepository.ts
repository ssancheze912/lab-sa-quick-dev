import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

export const clienteApiRepository: IClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return data
  },
}

import { apiClient } from '../../../../shared/lib/apiClient'
import type { IClienteRepository } from '../domain/IClienteRepository'
import type { Cliente } from '../domain/Cliente'

class ClienteApiRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  }
}

export const clienteApiRepository = new ClienteApiRepository()

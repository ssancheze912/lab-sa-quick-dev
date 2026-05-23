import { apiClient } from '../../../../shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

class ClienteApiRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  }

  async getById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
    return response.data
  }
}

export const clienteApiRepository: IClienteRepository = new ClienteApiRepository()

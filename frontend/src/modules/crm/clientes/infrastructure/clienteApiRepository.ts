import { apiClient } from '../../../../shared/lib/apiClient'
import type { Cliente, CreateClientePayload } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

const clienteApiRepository: IClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  },

  async getById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
    return response.data
  },

  async create(data: CreateClientePayload): Promise<Cliente> {
    const response = await apiClient.post<Cliente>('/api/v1/clientes', data)
    return response.data
  },
}

export { clienteApiRepository }

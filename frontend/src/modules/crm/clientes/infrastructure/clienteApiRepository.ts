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

  async create(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const response = await apiClient.post<Cliente>('/api/v1/clientes', data)
    return response.data
  }

  async update(id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Cliente> {
    const response = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data)
    return response.data
  }

  async deleteById(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/clientes/${id}`)
  }
}

export const clienteApiRepository = new ClienteApiRepository()

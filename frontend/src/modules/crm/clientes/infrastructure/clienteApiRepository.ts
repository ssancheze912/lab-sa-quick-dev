import axios from 'axios'
import { apiClient } from '../../../../shared/lib/apiClient'
import type { IClienteRepository } from '../domain/IClienteRepository'
import type { Cliente } from '../domain/Cliente'

class ClienteApiRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  }

  async getById(id: string): Promise<Cliente | null> {
    try {
      const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }
}

export const clienteApiRepository = new ClienteApiRepository()

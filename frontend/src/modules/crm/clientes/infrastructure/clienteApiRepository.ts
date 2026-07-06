import { isAxiosError } from 'axios'
import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'
import type { IClienteRepository } from '@/modules/crm/clientes/domain/IClienteRepository'

class ClienteApiRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  }

  async getById(id: string): Promise<Cliente | null> {
    try {
      const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }
}

export const clienteApiRepository = new ClienteApiRepository()

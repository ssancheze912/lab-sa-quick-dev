import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'
import { apiClient } from '../../../../shared/lib/apiClient'

export const clienteApiRepository: IClienteRepository = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  },

  getById: async (id: string): Promise<Cliente> => {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
    return response.data
  },
}

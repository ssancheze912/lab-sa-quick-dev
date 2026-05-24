// Story 2.1: Client List & Search
// Infrastructure: API repository implementation for Cliente

import { apiClient } from '../../../../shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

const clienteApiRepositoryImpl: IClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  },
}

export const clienteApiRepository = clienteApiRepositoryImpl

import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'
import type { IClienteRepository } from '@/modules/crm/clientes/domain/IClienteRepository'

class ClienteApiRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes')
    return response.data
  }
}

export const clienteApiRepository = new ClienteApiRepository()

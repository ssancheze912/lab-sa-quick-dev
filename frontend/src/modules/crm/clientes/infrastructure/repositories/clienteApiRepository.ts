import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'
import type { IClienteRepository } from '@/modules/crm/clientes/domain/repositories/IClienteRepository'

class ClienteApiRepository implements IClienteRepository {
  async getAll(searchTerm?: string): Promise<Cliente[]> {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', {
      params: searchTerm ? { q: searchTerm } : undefined,
    })
    return data
  }

  async getById(id: string): Promise<Cliente> {
    const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
    return data
  }

  async create(payload: { nombre: string; nit: string; telefono: string; ciudad: string }): Promise<Cliente> {
    const { data } = await apiClient.post<Cliente>('/api/v1/clientes', payload)
    return data
  }

  async update(
    id: string,
    payload: { nombre: string; nit: string; telefono: string; ciudad: string },
  ): Promise<Cliente> {
    const { data } = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, payload)
    return data
  }
}

export const clienteApiRepository = new ClienteApiRepository()

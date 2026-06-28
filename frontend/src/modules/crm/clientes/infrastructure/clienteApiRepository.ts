import { apiClient } from '../../../../shared/lib/apiClient';
import type { Cliente } from '../domain/Cliente';
import type { IClienteRepository } from '../domain/IClienteRepository';
import type { ClienteFormData } from '../application/clienteSchema';

class ClienteApiRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return response.data;
  }

  async getById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
    return response.data;
  }

  async create(data: ClienteFormData): Promise<Cliente> {
    const response = await apiClient.post<Cliente>('/api/v1/clientes', data);
    return response.data;
  }

  async update(id: string, data: ClienteFormData): Promise<Cliente> {
    const response = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data);
    return response.data;
  }
}

export const clienteApiRepository = new ClienteApiRepository();

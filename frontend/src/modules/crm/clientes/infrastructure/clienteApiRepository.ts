import { apiClient } from '@/shared/lib/apiClient';
import type { Cliente } from '../domain/Cliente';
import type { ClienteFormData } from '../application/clienteSchema';
import type { IClienteRepository } from '../domain/IClienteRepository';

export const clienteApiRepository: IClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return response.data;
  },

  async getById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
    return response.data;
  },

  async create(data: ClienteFormData): Promise<Cliente> {
    const response = await apiClient.post<Cliente>('/api/v1/clientes', data);
    return response.data;
  },
};

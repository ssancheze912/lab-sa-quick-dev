import { apiClient } from '@/shared/lib/apiClient';
import type { IClienteRepository } from '../domain/IClienteRepository';
import type { Cliente } from '../domain/Cliente';
import type { CreateClienteData } from '../application/clienteSchema';

export const clienteApiRepository: IClienteRepository = {
  getAll: async () => {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
    return data;
  },
  create: async (payload: CreateClienteData) => {
    const { data: created } = await apiClient.post<Cliente>('/api/v1/clientes', payload);
    return created;
  },
};

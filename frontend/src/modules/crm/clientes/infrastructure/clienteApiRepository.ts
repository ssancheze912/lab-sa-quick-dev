import { apiClient } from '@/shared/lib/apiClient';
import type { IClienteRepository } from '../domain/IClienteRepository';
import type { Cliente } from '../domain/Cliente';
import type { CreateClienteInput } from '../domain/CreateClienteInput';

export const clienteApiRepository: IClienteRepository = {
  getAll: async () => {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
    return data;
  },
  create: async (payload: CreateClienteInput) => {
    const { data: created } = await apiClient.post<Cliente>('/api/v1/clientes', payload);
    return created;
  },
};

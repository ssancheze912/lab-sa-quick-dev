import { apiClient } from '@/shared/lib/apiClient';
import type { IClienteRepository } from '../domain/IClienteRepository';
import type { Cliente } from '../domain/Cliente';
import type { CreateClienteInput } from '../domain/CreateClienteInput';
import type { UpdateClienteData } from '../application/clienteSchema';

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
  update: async (id: string, data: UpdateClienteData) => {
    const { data: updated } = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data);
    return updated;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/clientes/${id}`);
  },
};

import { apiClient } from '@/shared/lib/apiClient';
import type { IClienteRepository } from '../domain/IClienteRepository';
import type { Cliente } from '../domain/Cliente';

export const clienteApiRepository: IClienteRepository = {
  getAll: async () => {
    const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return data;
  },
};

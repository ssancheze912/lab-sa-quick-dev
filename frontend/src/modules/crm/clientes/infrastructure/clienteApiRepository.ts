import { apiClient } from '../../../../shared/lib/apiClient';
import type { Cliente } from '../domain/Cliente';

export const clienteApiRepository = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return response.data;
  },
};

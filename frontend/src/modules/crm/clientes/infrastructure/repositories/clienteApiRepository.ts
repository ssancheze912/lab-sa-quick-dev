import { apiClient } from '../../../../shared/lib/apiClient';
import type { IClienteRepository } from '../../domain/repositories/IClienteRepository';
import type { Cliente } from '../../domain/entities/Cliente';

const clienteApiRepository: IClienteRepository = {
  async getAll(): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes');
    return response.data;
  },

  async getById(id: string): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`);
    return response.data;
  },
};

export { clienteApiRepository };

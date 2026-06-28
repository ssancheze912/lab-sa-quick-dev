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

  async delete(id: string): Promise<{ hadContacts: boolean }> {
    const response = await apiClient.delete(`/api/v1/clientes/${id}`);
    // 204 No Content → no contacts associated
    if (response.status === 204) return { hadContacts: false };
    // 200 OK → { hadContacts: true } — client had associated contacts
    const data = response.data;
    const hadContacts = data !== null && typeof data === 'object' && typeof (data as Record<string, unknown>).hadContacts === 'boolean'
      ? (data as { hadContacts: boolean }).hadContacts
      : true;
    return { hadContacts };
  }
}

export const clienteApiRepository = new ClienteApiRepository();

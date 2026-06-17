import type { Cliente } from './Cliente';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: string): Promise<Cliente>;
  create(data: Omit<Cliente, 'id' | 'createdAt'>): Promise<Cliente>;
  update(id: string, data: Omit<Cliente, 'id' | 'createdAt'>): Promise<Cliente>;
}

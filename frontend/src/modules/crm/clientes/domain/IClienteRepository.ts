import type { Cliente } from './Cliente'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente>
  update(id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Cliente>
}

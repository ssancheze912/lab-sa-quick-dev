import type { Cliente } from '../entities/Cliente';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: string): Promise<Cliente>;
}

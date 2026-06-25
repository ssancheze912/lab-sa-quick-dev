import type { Cliente } from './Cliente';
import type { CreateClienteInput } from './CreateClienteInput';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: string): Promise<Cliente>;
  create(data: CreateClienteInput): Promise<Cliente>;
}

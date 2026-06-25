import type { Cliente } from './Cliente';
import type { CreateClienteInput } from './CreateClienteInput';
import type { UpdateClienteData } from '../application/clienteSchema';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: string): Promise<Cliente>;
  create(data: CreateClienteInput): Promise<Cliente>;
  update(id: string, data: UpdateClienteData): Promise<Cliente>;
  delete(id: string): Promise<void>;
}

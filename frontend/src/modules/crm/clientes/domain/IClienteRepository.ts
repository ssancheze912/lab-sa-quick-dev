import type { Cliente } from './Cliente';
import type { CreateClienteData } from '../application/clienteSchema';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: string): Promise<Cliente>;
  create(data: CreateClienteData): Promise<Cliente>;
}

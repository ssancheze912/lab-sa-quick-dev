import type { Cliente } from './Cliente';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
}

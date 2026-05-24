import type { Cliente } from './Cliente';

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: string): Promise<Cliente | null>;
  create(data: { nombre: string; nit: string; telefono: string; ciudad: string }): Promise<Cliente>;
  update(id: string, data: { nombre: string; nit: string; telefono: string; ciudad: string }): Promise<Cliente>;
  delete(id: string): Promise<void>;
}

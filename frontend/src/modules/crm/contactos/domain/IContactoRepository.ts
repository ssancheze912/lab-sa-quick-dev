import type { Contacto } from './Contacto';
import type { ContactoFormData } from '../application/contactoSchema';

export interface IContactoRepository {
  getAll(): Promise<Contacto[]>;
  getById(id: string): Promise<Contacto>;
  getByClienteId(clienteId: string): Promise<Contacto[]>;
  create(data: ContactoFormData & { clienteId?: string | null }): Promise<Contacto>;
  update(id: string, data: ContactoFormData): Promise<Contacto>;
  delete(id: string): Promise<void>;
  assignCliente(contactoId: string, clienteId: string | null): Promise<Contacto>;
}

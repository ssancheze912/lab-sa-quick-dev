import type { Contacto } from './Contacto';
import type { ContactoFormData } from '../application/contactoSchema';

export interface IContactoRepository {
  getAll(): Promise<Contacto[]>;
  getById(id: string): Promise<Contacto>;
  create(data: ContactoFormData): Promise<Contacto>;
  update(id: string, data: ContactoFormData): Promise<Contacto>;
}

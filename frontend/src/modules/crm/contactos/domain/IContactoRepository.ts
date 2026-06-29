import type { Contacto } from './Contacto'

export interface IContactoRepository {
  getAll(): Promise<Contacto[]>
  getById(id: string): Promise<Contacto>
}

import type { Contacto } from './Contacto'

export type CreateContactoPayload = Pick<Contacto, 'nombre' | 'cargo' | 'telefono' | 'email'>

export interface IContactoRepository {
  getAll(): Promise<Contacto[]>
  getById(id: string): Promise<Contacto>
  create(data: CreateContactoPayload): Promise<Contacto>
}

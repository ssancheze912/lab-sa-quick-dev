import type { Contacto } from './Contacto'

export type CreateContactoPayload = Pick<Contacto, 'nombre' | 'cargo' | 'telefono' | 'email'>
export type UpdateContactoPayload = Pick<Contacto, 'nombre' | 'cargo' | 'telefono' | 'email'>

export interface IContactoRepository {
  getAll(): Promise<Contacto[]>
  getById(id: string): Promise<Contacto>
  getByClienteId(clienteId: string): Promise<Contacto[]>
  create(data: CreateContactoPayload): Promise<Contacto>
  update(id: string, data: UpdateContactoPayload): Promise<Contacto>
  delete(id: string): Promise<void>
  assignCliente(contactoId: string, clienteId: string | null): Promise<Contacto>
}

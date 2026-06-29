import type { Contacto } from './Contacto'

/** Input type for creating a contact — defined in Domain to avoid Application dependency */
export interface CreateContactoInput {
  nombre: string
  cargo: string
  telefono: string
  email: string
}

/** Input type for updating a contact */
export interface UpdateContactoInput {
  nombre: string
  cargo: string
  telefono: string
  email: string
}

export interface IContactoRepository {
  getAll(): Promise<Contacto[]>
  getById(id: string): Promise<Contacto>
  create(data: CreateContactoInput): Promise<Contacto>
  update(id: string, data: UpdateContactoInput): Promise<Contacto>
}

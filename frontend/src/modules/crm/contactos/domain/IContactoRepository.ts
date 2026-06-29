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

export interface GetAllContactosParams {
  sinCliente?: boolean
}

export interface IContactoRepository {
  getAll(params?: GetAllContactosParams): Promise<Contacto[]>
  getById(id: string): Promise<Contacto>
  getByClienteId(clienteId: string): Promise<Contacto[]>
  create(data: CreateContactoInput): Promise<Contacto>
  update(id: string, data: UpdateContactoInput): Promise<Contacto>
  delete(id: string): Promise<void>
  assignCliente(contactoId: string, clienteId: string | null): Promise<Contacto>
}

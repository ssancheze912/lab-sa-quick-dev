import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'

export interface ContactoCreatePayload {
  nombre: string
  cargo: string
  telefono: string
  email: string
}

export interface IContactoRepository {
  getAll(searchTerm?: string): Promise<Contacto[]>
  getById(id: string): Promise<Contacto>
  create(data: ContactoCreatePayload): Promise<Contacto>
}

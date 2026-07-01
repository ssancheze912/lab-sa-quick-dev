import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'

export interface IContactoRepository {
  getAll(searchTerm?: string): Promise<Contacto[]>
}

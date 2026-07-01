import { apiClient } from '@/shared/lib/apiClient'
import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'
import type { IContactoRepository } from '@/modules/crm/contactos/domain/repositories/IContactoRepository'

class ContactoApiRepository implements IContactoRepository {
  async getAll(searchTerm?: string): Promise<Contacto[]> {
    const { data } = await apiClient.get<Contacto[]>('/api/v1/contactos', {
      params: searchTerm ? { q: searchTerm } : undefined,
    })
    return data
  }

  async getById(id: string): Promise<Contacto> {
    const { data } = await apiClient.get<Contacto>(`/api/v1/contactos/${id}`)
    return data
  }
}

export const contactoApiRepository = new ContactoApiRepository()

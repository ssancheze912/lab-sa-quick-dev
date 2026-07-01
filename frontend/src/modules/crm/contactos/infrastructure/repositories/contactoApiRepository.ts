import { apiClient } from '@/shared/lib/apiClient'
import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'
import type {
  ContactoCreatePayload,
  IContactoRepository,
} from '@/modules/crm/contactos/domain/repositories/IContactoRepository'

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

  async create(payload: ContactoCreatePayload): Promise<Contacto> {
    const { data } = await apiClient.post<Contacto>('/api/v1/contactos', payload)
    return data
  }
}

export const contactoApiRepository = new ContactoApiRepository()

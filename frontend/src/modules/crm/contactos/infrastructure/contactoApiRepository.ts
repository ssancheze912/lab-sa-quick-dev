import type { IContactoRepository } from '../domain/IContactoRepository'
import type { Contacto } from '../domain/Contacto'
import type { ContactoFormData } from '../application/contactoSchema'
import { apiClient } from '../../../../shared/lib/apiClient'

export const contactoApiRepository: IContactoRepository = {
  async getAll(): Promise<Contacto[]> {
    const response = await apiClient.get<Contacto[]>('/api/v1/contactos')
    return response.data
  },

  async getById(id: string): Promise<Contacto> {
    const response = await apiClient.get<Contacto>(`/api/v1/contactos/${id}`)
    return response.data
  },

  async create(data: ContactoFormData): Promise<Contacto> {
    const response = await apiClient.post<Contacto>('/api/v1/contactos', data)
    return response.data
  },
}

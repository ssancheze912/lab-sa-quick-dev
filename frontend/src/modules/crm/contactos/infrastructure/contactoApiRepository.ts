import type { IContactoRepository, CreateContactoInput } from '../domain/IContactoRepository'
import type { Contacto } from '../domain/Contacto'
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

  async create(data: CreateContactoInput): Promise<Contacto> {
    const response = await apiClient.post<Contacto>('/api/v1/contactos', data)
    return response.data
  },
}

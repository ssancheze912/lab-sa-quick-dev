import { apiClient } from '../../../../shared/lib/apiClient'
import type { Contacto } from '../domain/Contacto'
import type { CreateContactoPayload, IContactoRepository, UpdateContactoPayload } from '../domain/IContactoRepository'

const contactoApiRepository: IContactoRepository = {
  async getAll(): Promise<Contacto[]> {
    const response = await apiClient.get<Contacto[]>('/api/v1/contactos')
    return response.data
  },

  async getById(id: string): Promise<Contacto> {
    const response = await apiClient.get<Contacto>(`/api/v1/contactos/${id}`)
    return response.data
  },

  async getByClienteId(clienteId: string): Promise<Contacto[]> {
    const response = await apiClient.get<Contacto[]>(`/api/v1/contactos?clienteId=${clienteId}`)
    return response.data
  },

  async create(data: CreateContactoPayload): Promise<Contacto> {
    const response = await apiClient.post<Contacto>('/api/v1/contactos', data)
    return response.data
  },

  async update(id: string, data: UpdateContactoPayload): Promise<Contacto> {
    const response = await apiClient.put<Contacto>(`/api/v1/contactos/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/contactos/${id}`)
  },
}

export { contactoApiRepository }

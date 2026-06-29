import type { IContactoRepository } from '../domain/IContactoRepository'
import type { Contacto } from '../domain/Contacto'
import { apiClient } from '../../../../shared/lib/apiClient'

export const contactoApiRepository: IContactoRepository = {
  async getAll(): Promise<Contacto[]> {
    const response = await apiClient.get<Contacto[]>('/api/v1/contactos')
    return response.data
  },
}

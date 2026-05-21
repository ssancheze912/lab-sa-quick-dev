import { apiClient } from '../../../../shared/lib/apiClient'
import type { Contacto } from '../domain/Contacto'
import type { IContactoRepository } from '../domain/IContactoRepository'

const contactoApiRepository: IContactoRepository = {
  async getAll(): Promise<Contacto[]> {
    const response = await apiClient.get<Contacto[]>('/api/v1/contactos')
    return response.data
  },
}

export { contactoApiRepository }

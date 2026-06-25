import { apiClient } from '@/shared/lib/apiClient';
import type { IContactoRepository } from '../domain/IContactoRepository';
import type { Contacto } from '../domain/Contacto';

export const contactoApiRepository: IContactoRepository = {
  getAll: async () => {
    const { data } = await apiClient.get<Contacto[]>('/api/v1/contactos');
    return data;
  },
};

import { useQuery } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useContacto = (id: string | undefined) =>
  useQuery({
    queryKey: ['contactos', id],
    queryFn: () => contactoApiRepository.getById(id!),
    enabled: !!id,
    staleTime: 0,
  });

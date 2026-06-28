import { useQuery } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useContactos = () =>
  useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
    staleTime: 0,
  });

import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactoById(id: string | undefined) {
  return useQuery({
    queryKey: ['contactos', id],
    queryFn: () => contactoApiRepository.getById(id!),
    enabled: !!id,
    retry: false,
  })
}

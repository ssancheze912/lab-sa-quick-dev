import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContacto(contactoId: string | null | undefined) {
  return useQuery({
    queryKey: ['contactos', contactoId],
    queryFn: () => contactoApiRepository.getById(contactoId!),
    enabled: !!contactoId,
    staleTime: 0,
    retry: 0,
  })
}

import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '@/modules/crm/contactos/infrastructure/repositories/contactoApiRepository'

export function useContactos() {
  return useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
    staleTime: 60_000,
  })
}

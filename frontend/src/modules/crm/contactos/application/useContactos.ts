import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactos() {
  return useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
  })
}

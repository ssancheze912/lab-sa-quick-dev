import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactos() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
    staleTime: 0,
  })

  return { data, isLoading, isError, refetch }
}

import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactos(sinCliente = false) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contactos', { sinCliente }],
    queryFn: () => contactoApiRepository.getAll({ sinCliente }),
    staleTime: 0,
  })

  return { data, isLoading, isError, refetch }
}

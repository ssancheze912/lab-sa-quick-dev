import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * TanStack Query hook for the clientes list. The canonical query key
 * `['clientes']` is invalidated by the create/update/delete mutations
 * landing in stories 2.3 / 2.4 / 2.5.
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'] as const,
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 1000 * 60,
  })
}

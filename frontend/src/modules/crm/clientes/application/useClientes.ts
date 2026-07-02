import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Reads the full clientes list once per staleTime window and hands the array
 * over to the presentation layer where filtering happens client-side.
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'] as const,
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
    staleTime: 30_000,
  })
}

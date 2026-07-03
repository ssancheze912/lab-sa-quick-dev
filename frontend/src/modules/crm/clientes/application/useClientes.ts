import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Query hook for the full clientes list.
 * `queryKey: ['clientes']` is canonical per architecture.md#TanStack Query keys —
 * Stories 2.3/2.4/2.5 will invalidate this exact key on mutations.
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
    staleTime: 30_000,
  })
}

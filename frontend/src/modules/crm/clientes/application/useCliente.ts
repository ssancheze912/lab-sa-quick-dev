// Story 2.2: Client Detail View
// Application hook: useCliente — TanStack Query wrapper for single client

import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id),
    enabled: !!id,
  })
}

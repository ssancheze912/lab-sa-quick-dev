import { useQuery } from '@tanstack/react-query'

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

/**
 * Story 2.1 — TanStack Query hook for the client list.
 *
 * Fires a single GET /api/v1/clientes on mount; the search filter runs entirely
 * client-side over this cache. Inherits the 60s staleTime default from the
 * shared queryClient.
 */
export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  })
}

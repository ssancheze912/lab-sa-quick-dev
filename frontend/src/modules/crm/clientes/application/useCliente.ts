import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * TanStack Query hook for a single cliente. Canonical key `['clientes', id]`
 * per architecture.md §State Boundaries.
 *
 * - `data === null` → cliente does not exist (404 translated at the
 *   infrastructure boundary). The consumer renders the not-found view.
 * - `isError === true` → transport / 5xx failure. The consumer renders
 *   the ErrorPanel with Reintentar.
 */
export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id] as const,
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: typeof id === 'string' && id.length > 0,
    staleTime: 1000 * 60,
  })
}

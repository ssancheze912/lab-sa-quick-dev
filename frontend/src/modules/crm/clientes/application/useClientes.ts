import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Canonical TanStack Query hook for the Clientes domain.
 *
 * AC #9: `queryKey` MUST be the array literal `['clientes']` so that mutations
 * shipped in Stories 2.3 / 2.4 / 2.5 can invalidate via
 * `queryClient.invalidateQueries({ queryKey: ['clientes'] })`.
 *
 * AC #8: `retry: false` ensures a single failed fetch surfaces the ErrorPanel
 * immediately so the user can press "Reintentar" — silent background retries
 * would mask the failure and contradict the UX contract.
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'] as const,
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
    retry: false,
  })
}

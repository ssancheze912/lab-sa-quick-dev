import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Canonical TanStack Query hook for the Clientes domain.
 *
 * AC #9: `queryKey` MUST be the array literal `['clientes']` so that mutations
 * shipped in Stories 2.3 / 2.4 / 2.5 can invalidate via
 * `queryClient.invalidateQueries({ queryKey: ['clientes'] })`.
 *
 * Retry policy: defaults to TanStack Query v5 defaults (3 retries with
 * exponential backoff) so transient network failures self-heal. AC #8's
 * "fetch failure → ErrorPanel" contract still holds — the panel renders
 * after retries are exhausted. Tests opt out of retries via a test-local
 * `QueryClient` with `defaultOptions.queries.retry: false`.
 */
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'] as const,
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
  })
}

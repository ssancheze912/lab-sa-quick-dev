import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Canonical TanStack Query key for the client list — Story 2.1.
 * Mutation hooks in Stories 2.3–2.5 will `invalidateQueries(CLIENTES_QUERY_KEY)`
 * to trigger the automatic refetch that keeps the list fresh (FR27).
 */
export const CLIENTES_QUERY_KEY = ['clientes'] as const

/**
 * Fetches the full client list. Search is client-side (see `filterClientes`)
 * so this hook does NOT accept a query parameter. `staleTime` matches the
 * `queryClient` default (60s).
 */
export function useClientes() {
  return useQuery({
    queryKey: CLIENTES_QUERY_KEY,
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
    staleTime: 60_000,
  })
}

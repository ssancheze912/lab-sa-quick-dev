import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

/**
 * Canonical TanStack Query hook for the cliente list (Story 2.1).
 * The `['clientes']` queryKey is non-negotiable — Stories 2.3 / 2.4 / 2.5
 * invalidate it after mutations to refresh the list view.
 */
export function useClientes(): UseQueryResult<Cliente[], Error> {
  return useQuery({
    queryKey: ['clientes'] as const,
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
  })
}

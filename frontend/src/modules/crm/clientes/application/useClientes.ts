import { useQuery } from '@tanstack/react-query'
import type { Cliente } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Canonical query key for the clientes list (Story 2.1).
 * Story 2.3+ mutations MUST invalidate this exact tuple.
 */
export const CLIENTES_QUERY_KEY = ['clientes'] as const

/**
 * TanStack Query hook returning the full clientes list from the backend.
 * `staleTime: 30_000` keeps cache warm across route mounts within the same
 * session; mutations in later stories will invalidate the key explicitly.
 */
export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: CLIENTES_QUERY_KEY,
    queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
    staleTime: 30_000,
  })
}

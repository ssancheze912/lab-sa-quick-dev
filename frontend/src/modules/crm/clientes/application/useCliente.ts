import { useQuery } from '@tanstack/react-query'

import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import { ClienteNotFoundError } from '../domain/errors'
import type { Cliente } from '../domain/Cliente'

/**
 * Story 2.2 — TanStack Query hook for the single-client detail view.
 *
 * Query semantics:
 *   - queryKey: ['clientes', id] — hierarchical with the list query so a future
 *     invalidation of `['clientes']` covers both branches.
 *   - enabled: only fires when `id` is defined (guards route transitions).
 *   - retry: skips on the controlled 404 branch (`ClienteNotFoundError`);
 *     retries up to 2 times on any other failure.
 */
export function useCliente(id: string | undefined) {
  return useQuery<Cliente, Error>({
    queryKey: ['clientes', id],
    queryFn: () => {
      if (!id) throw new Error('Missing clienteId')
      return clienteApiRepository.getById(id)
    },
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      if (error instanceof ClienteNotFoundError) return false
      return failureCount < 2
    },
    // Keep retry backoff short — the controlled-state UX (ErrorPanel) should
    // surface quickly, and component tests rely on bounded latency.
    retryDelay: (attemptIndex) => Math.min(50 * 2 ** attemptIndex, 200),
  })
}

import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Query hook for a single cliente by id (Story 2.2).
 * `queryKey: ['clientes', id]` is canonical per architecture.md — mutations
 * from Stories 2.4/2.5 will invalidate this exact key.
 *
 * Retries on HTTP 404 are DISABLED: a 404 is deterministic "resource does not
 * exist" — retrying wastes bandwidth and delays the <ClienteNotFound> panel
 * the user should see immediately. Non-404 errors still retry up to 3 times.
 */
export function useCliente(clienteId: string) {
  return useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: ({ signal }) => clienteApiRepository.getById(clienteId, signal),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (isClienteNotFound(error)) {
        return false
      }
      return failureCount < 3
    },
    // Constant 100 ms between retries (linear, fast). Detail fetches are
    // small, single-record reads — the UI should recover quickly instead of
    // sitting on the default exponential backoff (1s → 2s → 4s).
    retryDelay: 100,
  })
}

/**
 * Type guard that discriminates a 404 (not-found UI branch) from any other
 * error (generic <ErrorPanel> retry branch). Exported so component tests can
 * assert against it directly.
 */
export function isClienteNotFound(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404
}

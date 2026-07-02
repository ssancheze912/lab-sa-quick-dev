import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { Cliente } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Reads a single cliente by id. Surfaces AxiosError as `error` when the backend
 * responds with a non-2xx (404 included). Callers check
 * `error.response?.status` to distinguish 404 (not-found panel) vs 5xx
 * (retryable error panel).
 *
 * When `clienteId` is undefined (e.g. index route without :clienteId), the
 * query is disabled and no network call fires.
 */
export function useCliente(clienteId: string | undefined) {
  return useQuery<Cliente, AxiosError>({
    queryKey: ['clientes', clienteId] as const,
    queryFn: ({ signal }) => {
      if (!clienteId) {
        throw new Error('clienteId is required')
      }
      return clienteApiRepository.getById(clienteId, signal)
    },
    enabled: Boolean(clienteId),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // 404 is a deterministic "record does not exist" — retrying is wasteful.
      if (error.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

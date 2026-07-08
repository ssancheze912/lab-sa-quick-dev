import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { AxiosError } from 'axios'
import type { Cliente } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import { CLIENTES_QUERY_KEY } from './useClientes'
import type { ClienteFormValues } from './clienteSchema'

/**
 * Classified mutation error. The form component decides between an inline NIT
 * error (`nit-conflict`) and a top-of-form Alert (`network` / `validation`).
 */
export interface CreateClienteError {
  /**
   * - `nit-conflict` → backend returned 409 (duplicate NIT)
   * - `validation`   → backend returned 400 (Zod bypass — defense-in-depth)
   * - `network`      → any other failure (500, offline, aborted)
   */
  kind: 'nit-conflict' | 'validation' | 'network'
  nitMessage?: string
  generic?: { title: string; subtitle: string }
}

/**
 * Mutation hook for POST /api/v1/clientes (Story 2.3).
 *
 * On success:
 *   - invalidates ['clientes'] (R-011 mitigation)
 *   - fires the success toast in Spanish
 *
 * On error the hook classifies the failure so the form component can decide
 * inline-field vs. top-of-form alerting (AC #4 vs. #7). The raw axios error is
 * NEVER surfaced (NFR6 / R-001 anti-leak).
 */
export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation<Cliente, CreateClienteError, ClienteFormValues>({
    mutationFn: async (payload) => {
      try {
        return await clienteApiRepository.create(payload)
      } catch (rawError) {
        throw classifyCreateError(rawError)
      }
    },
    // Explicit retry: 0 — the user drives retries via the form. Do NOT auto-retry
    // 400/409 (would resubmit bad/duplicated data) or 500 (would spam the server).
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY })
      toast.success('Cliente creado correctamente')
    },
  })
}

function classifyCreateError(rawError: unknown): CreateClienteError {
  if (rawError instanceof AxiosError) {
    const status = rawError.response?.status
    if (status === 409) {
      return { kind: 'nit-conflict', nitMessage: 'El NIT/RUC ya está registrado' }
    }
    if (status === 400) {
      // Backend validation reached FE only if Zod was bypassed — surface as generic.
      return {
        kind: 'validation',
        generic: {
          title: 'No se pudo guardar',
          subtitle: 'Comprueba los datos e intenta nuevamente.',
        },
      }
    }
  }
  return {
    kind: 'network',
    generic: {
      title: 'No se pudo guardar',
      subtitle: 'Comprueba tu conexión e intenta nuevamente.',
    },
  }
}

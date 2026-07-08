import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { AxiosError } from 'axios'
import type { Cliente } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import { CLIENTES_QUERY_KEY } from './useClientes'
import type { ClienteFormValues } from './clienteSchema'

/**
 * Classified mutation error for edit (Story 2.4). Extends the Story 2.3
 * `CreateClienteError` shape with a fourth kind (`not-found`) that the form
 * shell renders as a top-of-form alert with a distinct copy — the user's only
 * recourse is to close the dialog (the row is gone).
 */
export interface UpdateClienteError {
  /**
   * - `nit-conflict` → backend returned 409 (duplicate NIT on another row)
   * - `not-found`    → backend returned 404 (row was deleted by another user)
   * - `validation`   → backend returned 400 (Zod bypass — defense-in-depth)
   * - `network`      → any other failure (500, offline, aborted)
   */
  kind: 'nit-conflict' | 'not-found' | 'validation' | 'network'
  nitMessage?: string
  generic?: { title: string; subtitle: string }
}

export interface UpdateClienteVariables {
  id: string
  values: ClienteFormValues
}

/**
 * Mutation hook for PUT /api/v1/clientes/{id} (Story 2.4).
 *
 * On success:
 *   - invalidates ['clientes'] AND ['clientes', id] (R-011 — both the list
 *     and the currently-open detail view refetch)
 *   - fires the success toast in Spanish
 *
 * On error the hook classifies the failure so the form component can decide
 * inline-field vs. top-of-form alerting (AC #5 vs. #7). The raw axios error
 * is NEVER surfaced (NFR6 / R-001 anti-leak).
 */
export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation<Cliente, UpdateClienteError, UpdateClienteVariables>({
    mutationFn: async ({ id, values }) => {
      try {
        return await clienteApiRepository.update(id, values)
      } catch (rawError) {
        throw classifyUpdateError(rawError)
      }
    },
    // Explicit retry: 0 — the user drives retries via the form.
    retry: 0,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...CLIENTES_QUERY_KEY, variables.id] })
      toast.success('Cliente actualizado correctamente')
    },
  })
}

function classifyUpdateError(rawError: unknown): UpdateClienteError {
  if (rawError instanceof AxiosError) {
    const status = rawError.response?.status
    if (status === 409) {
      return { kind: 'nit-conflict', nitMessage: 'El NIT/RUC ya está registrado' }
    }
    if (status === 404) {
      return {
        kind: 'not-found',
        generic: {
          title: 'El cliente ya no existe',
          subtitle: 'Fue eliminado por otro usuario. Cierra el formulario para volver a la lista.',
        },
      }
    }
    if (status === 400) {
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

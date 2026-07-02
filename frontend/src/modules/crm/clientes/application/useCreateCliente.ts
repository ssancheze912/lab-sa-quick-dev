import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'siesa-ui-kit'
import type { Cliente } from '../domain/Cliente'
import type { CreateClientePayload } from '../domain/IClienteRepository'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Shape of the Problem Details body the backend emits for 409 conflicts.
 * ASP.NET's `Results.Problem(extensions: ...)` flattens the extensions bag
 * into the response root, so `field` sits at the top level (NOT under a
 * nested `extensions` key). Only the fields the frontend actually reads
 * are typed — the server may add `type`, `instance`, `detail`, etc. which
 * we intentionally ignore per NFR6.
 */
interface DuplicateNitProblem {
  readonly title?: string
  readonly field?: string
}

export type CreateClienteError = AxiosError<DuplicateNitProblem>

/**
 * Mutation for POST /api/v1/clientes.
 *
 * Success:
 *   1. Insert the new Cliente at the head of the ['clientes'] cache (optimistic
 *      append after server confirms — avoids the flash of a full refetch).
 *   2. Invalidate ['clientes'] so any stale consumers reconcile with the server.
 *   3. Toast success (Spanish, green, bottom-right, 3s).
 *
 * Error:
 *   • 409 → the caller (form component) handles it inline on the NIT field.
 *     No toast (business validation, not a network error — UX spec rule).
 *   • Anything else → toast red "No se pudo guardar. Intenta de nuevo." (5s).
 */
export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation<Cliente, CreateClienteError, CreateClientePayload>({
    mutationFn: (payload) => clienteApiRepository.create(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Cliente[]>(['clientes'], (prev) =>
        prev ? [created, ...prev] : [created],
      )
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente', {
        position: 'bottom-right',
        duration: 3000,
        color: 'green',
      })
    },
    onError: (error) => {
      // 409 is surfaced to the form so it can render an inline field error.
      // 400 is defensive (FluentValidation covers what Zod already blocks);
      // handled as a network-style error only if it slips through.
      if (error.response?.status === 409) {
        return
      }
      toast.error('No se pudo guardar. Intenta de nuevo.', {
        position: 'bottom-right',
        duration: 5000,
        color: 'red',
      })
    },
  })
}

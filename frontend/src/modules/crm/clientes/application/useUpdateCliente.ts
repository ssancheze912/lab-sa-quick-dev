import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'siesa-ui-kit'
import type { Cliente } from '../domain/Cliente'
import type { UpdateClientePayload } from '../domain/IClienteRepository'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Same Problem Details shape as CreateClienteError — the server flattens
 * the `extensions` bag into the response root (ASP.NET Results.Problem
 * behaviour), so `field` lives at the top level. Only the fields the
 * frontend actually reads are typed (NFR6 — never dump raw server strings).
 */
interface DuplicateNitProblem {
  readonly title?: string
  readonly field?: string
}

export type UpdateClienteError = AxiosError<DuplicateNitProblem>

/**
 * Mutation for PUT /api/v1/clientes/{id}.
 *
 * Success:
 *   1. Replace the cliente entry in the ['clientes'] cache in-place (order
 *      preserved — do NOT reinsert at head, unlike Create).
 *   2. Replace the cache for ['clientes', id] so ClienteDetailView reflects
 *      the change without a round trip.
 *   3. Invalidate both keys so any stale consumers reconcile.
 *   4. Toast success (Spanish, green, bottom-right, 3s).
 *
 * Error:
 *   • 409 → the caller (form component) handles it inline on the NIT field.
 *     No toast (business validation).
 *   • 404 → invalidate ['clientes'] so the ghost row disappears from the
 *     list, then a generic red toast.
 *   • Anything else → generic red toast "No se pudo guardar. Intenta de
 *     nuevo." (5s).
 */
export function useUpdateCliente(clienteId: string) {
  const queryClient = useQueryClient()

  return useMutation<Cliente, UpdateClienteError, UpdateClientePayload>({
    mutationFn: (payload) => clienteApiRepository.update(clienteId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<Cliente[]>(['clientes'], (prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
      )
      queryClient.setQueryData<Cliente>(['clientes', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', updated.id] })
      toast.success('Cliente actualizado correctamente', {
        position: 'bottom-right',
        duration: 3000,
        color: 'green',
      })
    },
    onError: (error) => {
      const status = error.response?.status
      if (status === 409) {
        // Surfaced to the form as an inline NIT error — no toast.
        return
      }
      if (status === 404) {
        // Row disappeared under us — refresh the list so it does not stay
        // in stale state.
        queryClient.invalidateQueries({ queryKey: ['clientes'] })
      }
      toast.error('No se pudo guardar. Intenta de nuevo.', {
        position: 'bottom-right',
        duration: 5000,
        color: 'red',
      })
    },
  })
}

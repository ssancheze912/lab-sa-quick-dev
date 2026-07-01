import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/repositories/clienteApiRepository'

/**
 * Mutation hook for deleting a client (Story 2.5, AC #2, #3, #6).
 *
 * Mirrors `useUpdateCliente`'s exact structure, differing only in:
 * (a) calling `clienteApiRepository.remove` instead of `.update`,
 * (b) invalidating ONLY `['clientes']` — NOT `['clientes', id]`, since the
 *     detail query for a now-deleted client should not be refetched (would
 *     404); the calling component clears its own selected-client state,
 * (c) TWO possible success toast strings, chosen by `hadAssociatedContacts`
 *     (read from the `X-Had-Associated-Contacts` response header via the
 *     repository) rather than a status-code branch,
 * (d) a specific 404 error toast ("El cliente ya no existe.") in addition to
 *     the generic fallback.
 */
export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.remove(id),
    onSuccess: ({ hadAssociatedContacts }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(
        hadAssociatedContacts
          ? 'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.'
          : 'Cliente eliminado correctamente',
      )
    },
    onError: (error) => {
      const isNotFound = isAxiosError(error) && error.response?.status === 404
      toast.error(isNotFound ? 'El cliente ya no existe.' : 'No se pudo eliminar. Intenta de nuevo.')
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { DeleteClienteResult } from '../domain/IClienteRepository'

interface DeleteArgs {
  id: string
}

/**
 * TanStack Query mutation hook for deleting a cliente. Story 2.5.
 *
 * On success:
 *   - Invalidates the list: `['clientes']`.
 *   - Removes the single-cliente cache: `removeQueries({ queryKey: ['clientes', id] })`.
 *     The row no longer exists, so refetching it would 404; removing the cache
 *     entry prevents stale data flashes if the user navigates back to the
 *     same id via the browser history.
 *
 * The hook DOES NOT fire toasts, close the dialog, or navigate — those
 * concerns live in the consuming component (`ClienteDeleteDialog`) per the
 * architecture.md §Process Patterns separation-of-concerns rule.
 *
 * The returned `DeleteClienteResult` carries `contactosOrphaned: number`
 * for the consuming component to branch the success toast copy (AC #5).
 */
export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation<DeleteClienteResult, unknown, DeleteArgs>({
    mutationFn: ({ id }) => clienteApiRepository.delete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.removeQueries({ queryKey: ['clientes', variables.id] })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { UpdateClienteInput } from '../domain/IClienteRepository'

interface UpdateArgs {
  id: string
  input: UpdateClienteInput
}

/**
 * TanStack Query mutation hook for updating a cliente. Story 2.4.
 *
 * On success invalidates BOTH the canonical `['clientes']` (list view) AND
 * `['clientes', id]` (detail view) query keys so both panels reflect the new
 * values immediately (FR27 — automatic propagation via cache invalidation).
 *
 * The hook DOES NOT fire toasts or close the dialog — those concerns live in
 * the consuming component (`ClienteForm`) per architecture.md §Process Patterns.
 *
 * Intentionally NOT optimistic: rollback on 409 (duplicate NIT) and 400
 * (FluentValidation) would require non-trivial bookkeeping in `onMutate` /
 * `onError`. Pure invalidation is acceptable UX inside the NFR2 2s budget.
 */
export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: UpdateArgs) =>
      clienteApiRepository.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] })
    },
  })
}

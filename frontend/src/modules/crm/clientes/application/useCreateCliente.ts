import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { CreateClienteInput } from '../domain/IClienteRepository'

/**
 * TanStack Query mutation hook for creating a cliente. On success invalidates
 * the canonical `['clientes']` query key so the list view picks up the new
 * row on its next refetch (FR27 — automatic propagation via cache invalidation).
 *
 * The hook DOES NOT fire toasts or close the dialog — those concerns live in
 * the consuming component (`ClienteForm`) per architecture.md §Process Patterns.
 */
export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateClienteInput) =>
      clienteApiRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

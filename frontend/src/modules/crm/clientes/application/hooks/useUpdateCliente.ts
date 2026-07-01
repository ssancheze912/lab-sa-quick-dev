import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/repositories/clienteApiRepository'

/**
 * Mutation hook for updating a client (Story 2.4, AC #2, #5, #7).
 *
 * Mirrors `useCreateCliente`'s exact structure, differing only in:
 * (a) calling `clienteApiRepository.update` instead of `.create`,
 * (b) invalidating `['clientes', id]` in addition to `['clientes']` — the
 *     edit affects a specific detail view the list does not (R6),
 * (c) the success toast text.
 *
 * The 409 duplicate NIT/RUC case is intentionally NOT surfaced via
 * `toast.error` — AC #5 requires the form to stay open with the entered
 * data intact and render the conflict message inline, handled by `ClienteForm`.
 */
export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { nombre: string; nit: string; telefono: string; ciudad: string }) =>
      clienteApiRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', id] })
      toast.success('Cliente actualizado correctamente')
    },
    onError: (error) => {
      const isConflict = isAxiosError(error) && error.response?.status === 409
      if (!isConflict) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}

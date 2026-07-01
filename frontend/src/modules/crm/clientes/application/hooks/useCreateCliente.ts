import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/repositories/clienteApiRepository'

/**
 * Mutation hook for creating a client (Story 2.3, AC #2, #5).
 *
 * The 409 duplicate NIT/RUC case is intentionally NOT surfaced via
 * `toast.error` — AC #5 requires the form to stay open with the entered
 * data intact and render the conflict message inline, so the discriminated
 * error propagates (mirrors `useCliente`'s `isAxiosError` 404 precedent) and
 * is handled by `ClienteForm`.
 */
export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clienteApiRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
    onError: (error) => {
      const isConflict = isAxiosError(error) && error.response?.status === 409
      if (!isConflict) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}

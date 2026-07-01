import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { contactoApiRepository } from '@/modules/crm/contactos/infrastructure/repositories/contactoApiRepository'

/**
 * Mutation hook for creating a contact (Story 3.3, AC #2, #5).
 *
 * `ContactoEntity` has no unique business key, so there is no 409 path
 * (unlike `useCreateCliente`). The 400 validation case is intentionally NOT
 * surfaced via `toast.error` — AC #5 requires the form to stay open with the
 * entered data intact and render the field-level messages inline, so the
 * discriminated error propagates (mirrors `useContacto`'s `isAxiosError` 404
 * precedent) and is handled by `ContactoForm`.
 */
export function useCreateContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contactoApiRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      toast.success('Contacto creado correctamente')
    },
    onError: (error) => {
      const isValidationError = isAxiosError(error) && error.response?.status === 400
      if (!isValidationError) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}

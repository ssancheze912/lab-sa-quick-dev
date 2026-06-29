import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormData } from './contactoSchema'

export function useCreateContacto(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ContactoFormData) => contactoApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      options?.onSuccess?.()
    },
    onError: (_error: unknown) => {
      // Error is surfaced via isError — do NOT expose technical details (NFR6)
    },
  })
}

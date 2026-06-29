import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormData } from './contactoSchema'

export function useUpdateContacto(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactoFormData }) =>
      contactoApiRepository.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', id] })
      options?.onSuccess?.()
    },
    onError: (_error: unknown) => {
      // Error is surfaced via isError — do NOT expose technical details (NFR6)
    },
  })
}

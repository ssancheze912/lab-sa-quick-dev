import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormValues } from './contactoSchema'
import { toast } from '../../../../shared/lib/toastStore'

interface UpdateContactoParams {
  id: string
  data: ContactoFormValues
}

export function useUpdateContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: UpdateContactoParams) =>
      contactoApiRepository.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', id] })
      toast.success('Contacto actualizado correctamente')
    },
  })
}

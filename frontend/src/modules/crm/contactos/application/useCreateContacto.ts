import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import type { ContactoFormValues } from './contactoSchema'
import { toast } from '../../../../shared/lib/toastStore'

export function useCreateContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ContactoFormValues) => contactoApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      toast.success('Contacto creado correctamente')
    },
  })
}

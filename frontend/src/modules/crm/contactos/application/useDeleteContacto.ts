import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

interface UseDeleteContactoOptions {
  onSuccess?: () => void
}

export function useDeleteContacto(options?: UseDeleteContactoOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactoApiRepository.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', id] })
      toast.success('Contacto eliminado correctamente')
      options?.onSuccess?.()
    },
    onError: () => {
      toast.error('Error al eliminar el contacto')
    },
  })
}

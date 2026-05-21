import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useDeleteContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactoApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      toast.success('Contacto eliminado correctamente')
    },
    onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.'),
  })
}

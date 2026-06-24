import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; hasContacts?: boolean }) =>
      clienteApiRepository.deleteById(id),
    onSuccess: (_result, { hasContacts }) => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      void queryClient.invalidateQueries({ queryKey: ['contactos'] })
      if (hasContacts) {
        toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
      } else {
        toast.success('Cliente eliminado correctamente')
      }
    },
    onError: () => {
      toast.error('No se pudo eliminar. Intenta de nuevo.')
    },
  })
}

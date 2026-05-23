import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useAssignClienteToContacto(clienteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactoId, newClienteId }: { contactoId: string; newClienteId: string | null }) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      if (clienteId) {
        queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] })
      }
    },
    onError: () => {
      toast.error('No se pudo actualizar la asociación. Intenta de nuevo.')
    },
  })
}

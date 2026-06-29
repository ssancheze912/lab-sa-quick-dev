import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

interface ReasignarParams {
  contactoId: string
  newClienteId: string
  oldClienteId: string
}

export function useReasignarContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactoId, newClienteId }: ReasignarParams) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: (_data, { contactoId, newClienteId, oldClienteId }) => {
      void queryClient.invalidateQueries({ queryKey: ['contactos'] })
      void queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: oldClienteId }] })
      void queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: newClienteId }] })
      void queryClient.invalidateQueries({ queryKey: ['contactos', contactoId] })
      toast.success('Contacto reasignado correctamente')
    },
    onError: () => {
      toast.error('No se pudo reasignar el contacto. Intenta de nuevo.')
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { contactoApiRepository } from '../../contactos/infrastructure/contactoApiRepository'

interface DesasociarContactoVariables {
  contactoId: string
  clienteId: string
}

export function useDesasociarContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactoId }: DesasociarContactoVariables) =>
      contactoApiRepository.assignCliente(contactoId, null),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: variables.clienteId }] })
      toast.success('Contacto desasociado correctamente')
    },
    onError: () => {
      toast.error('No se pudo desasociar el contacto. Intenta de nuevo.')
    },
  })
}
